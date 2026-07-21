//! Server-computed view models for issues #49/#50/#51 — pure projection logic
//! over DB rows and guild snapshots, unit tested below.

use std::collections::{HashMap, HashSet};

use crate::discord::bot::{GuildEntities, GuildRoleLite};
use crate::models::{
    AssociableOptions, AssociableRole, Game, Role, RoleCategory, RoleSettingsCategory,
    RoleSettingsRole, RoleSettingsView, TopicDetailsChannel, TopicSearchResult, TopicSearchRole,
};

/// GET /search/all items (issue #49): resolve channel names and role
/// name/color/assignment. Channels and roles that no longer exist in the guild
/// are dropped, like the details endpoint.
pub fn project_topic_search_results(
    games: Vec<Game>,
    entities: &GuildEntities,
    member_role_ids: &HashSet<String>,
) -> Vec<TopicSearchResult> {
    let channel_name_by_id: HashMap<&str, &str> = entities
        .channels
        .iter()
        .map(|channel| (channel.id.as_str(), channel.name.as_str()))
        .collect();
    let role_by_id: HashMap<&str, &GuildRoleLite> = entities
        .roles
        .iter()
        .map(|role| (role.id.as_str(), role))
        .collect();

    games
        .into_iter()
        .map(|game| TopicSearchResult {
            game_id: game.game.game_id,
            name: game.game.name,
            channels: game
                .game
                .channels
                .unwrap_or_default()
                .into_iter()
                .filter_map(|channel_id| {
                    channel_name_by_id
                        .get(channel_id.as_str())
                        .map(|name| TopicDetailsChannel {
                            id: channel_id.clone(),
                            name: (*name).to_string(),
                        })
                })
                .collect(),
            roles: game
                .games_roles
                .unwrap_or_default()
                .into_iter()
                .filter_map(|relation| {
                    role_by_id.get(relation.role_id.as_str()).map(|role| TopicSearchRole {
                        id: relation.role_id.clone(),
                        name: role.name.clone(),
                        color: role.color.clone(),
                        assigned: member_role_ids.contains(&relation.role_id),
                    })
                })
                .collect(),
        })
        .collect()
}

/// GET /roles/settings view (issue #50). Policy: unsynced roles and @everyone
/// are excluded, managed roles are visible but not editable; the verification
/// category is marked and not deletable.
pub fn build_role_settings_view(
    server_id: &str,
    db_roles: &[Role],
    role_categories: &[RoleCategory],
    guild_roles: &[GuildRoleLite],
) -> RoleSettingsView {
    let db_role_by_id: HashMap<&str, &Role> = db_roles
        .iter()
        .map(|role| (role.role_id.as_str(), role))
        .collect();

    let categories = role_categories
        .iter()
        .map(|category| RoleSettingsCategory {
            id: category.role_category_id,
            name: category.name.clone(),
            kind: if category.is_verification {
                "verification".to_string()
            } else {
                "normal".to_string()
            },
            deletable: !category.is_verification,
        })
        .collect();

    let roles = guild_roles
        .iter()
        .filter(|role| role.id != server_id) // @everyone
        .filter_map(|role| {
            let db_role = db_role_by_id.get(role.id.as_str())?; // unsynced: hidden
            Some(RoleSettingsRole {
                id: role.id.clone(),
                name: role.name.clone(),
                color: role.color.clone(),
                category_id: db_role.role_category_id,
                self_assignable: db_role.self_assignable,
                description: db_role.description.clone(),
                editable: !role.managed,
            })
        })
        .collect();

    RoleSettingsView { categories, roles }
}

/// GET /games/associables (issue #51): what a topic may be associated with,
/// matching the update validation policy — roles must be synced, non-managed
/// and never @everyone; channels must exist in the guild (offered here as the
/// text channels the client can meaningfully link).
pub fn build_associable_options(
    server_id: &str,
    entities: &GuildEntities,
    db_roles: &[Role],
) -> AssociableOptions {
    let synced: HashSet<&str> = db_roles.iter().map(|role| role.role_id.as_str()).collect();
    AssociableOptions {
        channels: entities
            .channels
            .iter()
            .filter(|channel| channel.is_text)
            .map(|channel| TopicDetailsChannel {
                id: channel.id.clone(),
                name: channel.name.clone(),
            })
            .collect(),
        roles: entities
            .roles
            .iter()
            .filter(|role| {
                role.id != server_id && !role.managed && synced.contains(role.id.as_str())
            })
            .map(|role| AssociableRole {
                id: role.id.clone(),
                name: role.name.clone(),
                color: role.color.clone(),
            })
            .collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::discord::bot::GuildChannelLite;
    use crate::models::{GameWithoutRelations, RoleRelationToGame};
    use serenity::model::id::GuildId;

    const SID: &str = "1";

    fn entities() -> GuildEntities {
        GuildEntities {
            guild_id: GuildId::new(1),
            channels: vec![
                GuildChannelLite { id: "10".into(), name: "general".into(), is_text: true },
                GuildChannelLite { id: "11".into(), name: "voice".into(), is_text: false },
            ],
            roles: vec![
                GuildRoleLite { id: SID.into(), name: "@everyone".into(), managed: false, color: "#000000".into() },
                GuildRoleLite { id: "20".into(), name: "gamer".into(), managed: false, color: "#ff0000".into() },
                GuildRoleLite { id: "21".into(), name: "bot-managed".into(), managed: true, color: "#00ff00".into() },
                GuildRoleLite { id: "22".into(), name: "unsynced".into(), managed: false, color: "#0000ff".into() },
            ],
        }
    }

    fn db_role(role_id: &str) -> Role {
        Role {
            server_id: SID.into(),
            role_id: role_id.into(),
            role_category_id: Some(5),
            self_assignable: true,
            description: Some("d".into()),
        }
    }

    fn category(id: i32, is_verification: bool) -> RoleCategory {
        RoleCategory {
            role_category_id: id,
            server_id: SID.into(),
            name: if is_verification { "verification".into() } else { "misc".into() },
            is_verification,
        }
    }

    #[test]
    fn search_results_resolve_names_and_assignment() {
        let game = Game {
            game: GameWithoutRelations {
                game_id: 7,
                server_id: SID.into(),
                name: "Factorio".into(),
                description: None,
                category_id: None,
                thumbnail: None,
                channels: Some(vec!["10".into(), "999".into()]),
            },
            games_tags: Some(vec![]),
            games_roles: Some(vec![
                RoleRelationToGame { game_id: 7, role_id: "20".into() },
                RoleRelationToGame { game_id: 7, role_id: "999".into() },
            ]),
        };
        let member: HashSet<String> = ["20".to_string()].into();
        let results = project_topic_search_results(vec![game], &entities(), &member);

        assert_eq!(results.len(), 1);
        let result = &results[0];
        assert_eq!(result.game_id, 7);
        // deleted channel/role 999 dropped, names resolved
        assert_eq!(result.channels.len(), 1);
        assert_eq!(result.channels[0].name, "general");
        assert_eq!(result.roles.len(), 1);
        assert_eq!(result.roles[0].name, "gamer");
        assert!(result.roles[0].assigned);
    }

    #[test]
    fn role_settings_apply_policy() {
        let db_roles = vec![db_role("20"), db_role("21")];
        let categories = vec![category(1, true), category(2, false)];
        let view = build_role_settings_view(SID, &db_roles, &categories, &entities().roles);

        assert_eq!(view.categories.len(), 2);
        assert_eq!(view.categories[0].kind, "verification");
        assert!(!view.categories[0].deletable);
        assert!(view.categories[1].deletable);

        // @everyone and unsynced roles hidden; managed visible but not editable
        assert_eq!(view.roles.len(), 2);
        let gamer = view.roles.iter().find(|role| role.id == "20").unwrap();
        assert!(gamer.editable);
        assert_eq!(gamer.category_id, Some(5));
        let managed = view.roles.iter().find(|role| role.id == "21").unwrap();
        assert!(!managed.editable);
    }

    #[test]
    fn associables_match_write_validation_policy() {
        let db_roles = vec![db_role("20"), db_role("21")];
        let options = build_associable_options(SID, &entities(), &db_roles);

        // text channels only
        assert_eq!(options.channels.len(), 1);
        assert_eq!(options.channels[0].id, "10");
        // synced + non-managed + not @everyone
        assert_eq!(options.roles.len(), 1);
        assert_eq!(options.roles[0].id, "20");
    }
}
