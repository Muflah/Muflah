import { database } from "./database";

export async function recordUsernameAlias(userId: string, username: string, displayUsername: string) {
  await database.query(
    `INSERT INTO username_aliases (user_id, username, display_username)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING`,
    [userId, username, displayUsername],
  );
}
