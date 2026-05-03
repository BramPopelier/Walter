Approve a user so they can access the dashboard.

The user's email is: $ARGUMENTS

Generate the SQL to run in the Supabase SQL editor to approve this user:

```sql
UPDATE profiles SET approved = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = '<email>');
```

Then verify it worked:

```sql
SELECT u.email, p.approved, p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = '<email>';
```

Also tell the user: if the UPDATE returns 0 rows, the profiles row doesn't exist yet (sign-up trigger may have failed). In that case run this INSERT instead:

```sql
INSERT INTO profiles (user_id, approved)
SELECT id, true FROM auth.users WHERE email = '<email>';
```
