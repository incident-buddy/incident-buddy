import sql from "~/db.servier.ts";

export async function fetchHash(email: string) {
  const [row] = await sql`
	  select uhp.user_id, uhp.hashed_password
    from user_emails ue
	  inner join user_hashed_passwords uhp on ue.user_id = uhp.user_id
	  where ue.email = ${email}`;

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    hash: row.hashed_password,
  };
}
