//! Port of `../server/src/functions/categorize-member-roles.ts` — groups a
//! member's Discord roles by the server's role categories for GET /me.

use crate::models::{CategorizedRoleGroup, Role, RoleCategory, ServerMemberRole};

/// A member's Discord role with the display fields the client needs.
pub struct MemberRoleInfo {
    pub id: String,
    pub name: String,
    pub color: String,
}

/// Roles unknown to the DB are skipped; roles with no (or an unknown) category
/// fall into a trailing "uncategorized" group. Groups follow the given
/// category order and empty groups are omitted.
pub fn categorize_member_roles(
    server_id: &str,
    member_roles: &[MemberRoleInfo],
    database_roles: &[Role],
    role_categories: &[RoleCategory],
) -> Vec<CategorizedRoleGroup> {
    let db_role_by_id: std::collections::HashMap<&str, &Role> = database_roles
        .iter()
        .map(|role| (role.role_id.as_str(), role))
        .collect();
    let known_category_ids: std::collections::HashSet<i32> = role_categories
        .iter()
        .map(|category| category.role_category_id)
        .collect();

    let mut roles_by_category: std::collections::HashMap<i32, Vec<ServerMemberRole>> =
        std::collections::HashMap::new();
    let mut uncategorized: Vec<ServerMemberRole> = Vec::new();

    for role in member_roles {
        // @everyone has the guild's ID.
        if role.id == server_id {
            continue;
        }
        let Some(db_role) = db_role_by_id.get(role.id.as_str()) else {
            continue;
        };
        let member_role = ServerMemberRole {
            role_id: role.id.clone(),
            name: role.name.clone(),
            color: role.color.clone(),
        };
        match db_role.role_category_id {
            Some(category_id) if known_category_ids.contains(&category_id) => {
                roles_by_category.entry(category_id).or_default().push(member_role);
            }
            _ => uncategorized.push(member_role),
        }
    }

    let mut result: Vec<CategorizedRoleGroup> = role_categories
        .iter()
        .filter_map(|category| {
            roles_by_category
                .remove(&category.role_category_id)
                .filter(|roles| !roles.is_empty())
                .map(|roles| CategorizedRoleGroup {
                    role_category_id: Some(category.role_category_id),
                    role_category_name: Some(category.name.clone()),
                    roles,
                })
        })
        .collect();
    if !uncategorized.is_empty() {
        result.push(CategorizedRoleGroup {
            role_category_id: None,
            role_category_name: None,
            roles: uncategorized,
        });
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    fn db_role(role_id: &str, category: Option<i32>) -> Role {
        Role {
            server_id: "1".into(),
            role_id: role_id.into(),
            role_category_id: category,
            self_assignable: false,
            description: None,
        }
    }

    fn member_role(id: &str, name: &str) -> MemberRoleInfo {
        MemberRoleInfo { id: id.into(), name: name.into(), color: "#000000".into() }
    }

    fn category(id: i32, name: &str) -> RoleCategory {
        RoleCategory {
            role_category_id: id,
            server_id: "1".into(),
            name: name.into(),
            is_verification: false,
        }
    }

    #[test]
    fn groups_by_category_in_order_with_uncategorized_last() {
        let groups = categorize_member_roles(
            "1",
            &[
                member_role("1", "everyone"),   // @everyone: skipped
                member_role("10", "unknown"),   // not in DB: skipped
                member_role("11", "verified"),  // category 5
                member_role("12", "gamer"),     // category absent -> uncategorized
                member_role("13", "ghost"),     // category 99 unknown -> uncategorized
            ],
            &[db_role("11", Some(5)), db_role("12", None), db_role("13", Some(99))],
            &[category(4, "empty"), category(5, "verification")],
        );

        assert_eq!(groups.len(), 2, "empty category must be omitted");
        assert_eq!(groups[0].role_category_id, Some(5));
        assert_eq!(groups[0].role_category_name.as_deref(), Some("verification"));
        assert_eq!(groups[0].roles.len(), 1);
        assert_eq!(groups[0].roles[0].role_id, "11");
        assert_eq!(groups[1].role_category_id, None);
        assert_eq!(groups[1].roles.len(), 2);
    }

    #[test]
    fn empty_when_member_has_no_db_roles() {
        let groups = categorize_member_roles("1", &[member_role("10", "x")], &[], &[]);
        assert!(groups.is_empty());
    }
}
