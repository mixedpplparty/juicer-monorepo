//! Pure input-validation and decision helpers, unit tested below.

use std::collections::HashSet;

use crate::error::{HttpError, Result};

pub const GAME_NAME_MAX: usize = 255;
pub const CATEGORY_NAME_MAX: usize = 100;
pub const TAG_NAME_MAX: usize = 50;
pub const DESCRIPTION_MAX: usize = 2000;
pub const ROLE_DESCRIPTION_MAX: usize = 500;
/// Cap on channels/tags/roles per request — far above any legitimate payload.
pub const ID_LIST_MAX: usize = 100;

/// Length is counted in chars, matching zod `.max()` and varchar limits.
pub fn validated_name(name: &str, max_chars: usize, label: &str) -> Result<String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(HttpError::bad_request(format!("{label} is required.")));
    }
    if trimmed.chars().count() > max_chars {
        return Err(HttpError::bad_request(format!("{label} is too long.")));
    }
    Ok(trimmed.to_string())
}

pub fn normalized_description(
    description: Option<String>,
    max_chars: usize,
) -> Result<Option<String>> {
    match description {
        None => Ok(None),
        Some(description) => {
            let trimmed = description.trim();
            if trimmed.chars().count() > max_chars {
                return Err(HttpError::bad_request("Description is too long."));
            }
            if trimmed.is_empty() {
                Ok(None)
            } else {
                Ok(Some(trimmed.to_string()))
            }
        }
    }
}

/// Discord snowflakes are numeric strings (64-bit unsigned, at most 20 digits).
pub fn is_valid_discord_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 20
        && value.bytes().all(|b| b.is_ascii_digit())
        && value.parse::<u64>().is_ok_and(|id| id != 0)
}

pub fn validated_discord_ids(ids: Vec<String>, label: &str) -> Result<Vec<String>> {
    if ids.len() > ID_LIST_MAX {
        return Err(HttpError::bad_request(format!("Too many {label}.")));
    }
    let mut seen = HashSet::new();
    let mut unique = Vec::with_capacity(ids.len());
    for id in ids {
        if !is_valid_discord_id(&id) {
            return Err(HttpError::bad_request(format!("Invalid {label} ID.")));
        }
        if seen.insert(id.clone()) {
            unique.push(id);
        }
    }
    Ok(unique)
}

pub fn validated_db_ids(ids: Vec<i32>, label: &str) -> Result<Vec<i32>> {
    if ids.len() > ID_LIST_MAX {
        return Err(HttpError::bad_request(format!("Too many {label}.")));
    }
    let mut seen = HashSet::new();
    let mut unique = Vec::with_capacity(ids.len());
    for id in ids {
        if id <= 0 {
            return Err(HttpError::bad_request(format!("Invalid {label} ID.")));
        }
        if seen.insert(id) {
            unique.push(id);
        }
    }
    Ok(unique)
}

/// Case-insensitive substring match; blank queries match nothing.
pub fn filter_ids_by_name_match<'a>(
    entities: impl IntoIterator<Item = (String, &'a str)>,
    query: &str,
) -> Vec<String> {
    let normalized_query = query.trim().to_lowercase();
    if normalized_query.is_empty() {
        return Vec::new();
    }
    entities
        .into_iter()
        .filter(|(_, name)| name.to_lowercase().contains(&normalized_query))
        .map(|(id, _)| id)
        .collect()
}

/// Admins always pass — otherwise enabling verification without holding the
/// roles would lock them out of the setting that turns it back off.
pub fn is_verification_satisfied(
    verification_required: bool,
    required_role_ids: &[String],
    member_role_ids: &HashSet<String>,
    manage_guild_permission: bool,
) -> bool {
    if !verification_required || required_role_ids.is_empty() {
        return true;
    }
    if manage_guild_permission {
        return true;
    }
    required_role_ids
        .iter()
        .all(|role_id| member_role_ids.contains(role_id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validated_name_trims_and_rejects_empty() {
        assert_eq!(validated_name("  Valorant  ", GAME_NAME_MAX, "Name").unwrap(), "Valorant");
        assert_eq!(validated_name("", GAME_NAME_MAX, "Name").unwrap_err().status.as_u16(), 400);
        assert_eq!(validated_name("   ", GAME_NAME_MAX, "Name").unwrap_err().status.as_u16(), 400);
    }

    #[test]
    fn validated_name_enforces_char_limit() {
        assert!(validated_name(&"a".repeat(255), GAME_NAME_MAX, "Name").is_ok());
        assert!(validated_name(&"a".repeat(256), GAME_NAME_MAX, "Name").is_err());
        // Multibyte: 50 Hangul characters fit the tag limit even though they
        // are 150 UTF-8 bytes.
        assert!(validated_name(&"가".repeat(50), TAG_NAME_MAX, "Name").is_ok());
        assert!(validated_name(&"가".repeat(51), TAG_NAME_MAX, "Name").is_err());
    }

    #[test]
    fn normalized_description_trims_and_nulls_empty() {
        assert_eq!(normalized_description(None, DESCRIPTION_MAX).unwrap(), None);
        assert_eq!(normalized_description(Some("   ".into()), DESCRIPTION_MAX).unwrap(), None);
        assert_eq!(
            normalized_description(Some("  hi  ".into()), DESCRIPTION_MAX).unwrap(),
            Some("hi".into())
        );
        assert!(normalized_description(Some("a".repeat(2001)), DESCRIPTION_MAX).is_err());
    }

    #[test]
    fn discord_id_format() {
        assert!(is_valid_discord_id("123456789012345678"));
        assert!(!is_valid_discord_id(""));
        assert!(!is_valid_discord_id("0"));
        assert!(!is_valid_discord_id("abc"));
        assert!(!is_valid_discord_id("1; DROP TABLE games"));
        assert!(!is_valid_discord_id("123456789012345678901")); // 21 digits
    }

    #[test]
    fn discord_ids_dedupe_and_reject_invalid() {
        assert_eq!(
            validated_discord_ids(vec!["1".into(), "1".into(), "2".into()], "channel").unwrap(),
            vec!["1".to_string(), "2".to_string()]
        );
        assert!(validated_discord_ids(vec!["abc".into()], "channel").is_err());
        assert!(validated_discord_ids(vec!["1".into(); ID_LIST_MAX + 1], "channel").is_err());
    }

    #[test]
    fn db_ids_dedupe_and_reject_invalid() {
        assert_eq!(validated_db_ids(vec![3, 3, 4], "tag").unwrap(), vec![3, 4]);
        assert!(validated_db_ids(vec![0], "tag").is_err());
        assert!(validated_db_ids(vec![-5], "tag").is_err());
    }

    #[test]
    fn name_match_is_case_insensitive_substring() {
        let entities = vec![
            ("1".to_string(), "general"),
            ("2".to_string(), "Valorant-Chat"),
            ("3".to_string(), "발로란트"),
        ];
        assert_eq!(filter_ids_by_name_match(entities.clone(), "valorant"), vec!["2"]);
        assert_eq!(filter_ids_by_name_match(entities.clone(), "발로"), vec!["3"]);
        assert_eq!(filter_ids_by_name_match(entities.clone(), "a"), vec!["1", "2"]);
        assert!(filter_ids_by_name_match(entities.clone(), "  ").is_empty());
        assert!(filter_ids_by_name_match(entities, "minecraft").is_empty());
    }

    #[test]
    fn verification_requires_all_roles() {
        let required = vec!["100".to_string(), "200".to_string()];
        let some: HashSet<String> = ["100".to_string()].into();
        let all: HashSet<String> = ["100".to_string(), "200".to_string(), "300".to_string()].into();
        let none: HashSet<String> = HashSet::new();

        assert!(is_verification_satisfied(false, &required, &none, false));
        assert!(is_verification_satisfied(true, &[], &none, false));
        assert!(!is_verification_satisfied(true, &required, &some, false));
        assert!(is_verification_satisfied(true, &required, &all, false));
        // Admin bypass.
        assert!(is_verification_satisfied(true, &required, &none, true));
    }
}
