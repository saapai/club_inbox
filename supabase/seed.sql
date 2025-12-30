-- Seed data for Club Claims Inbox

-- Create a default demo club
INSERT INTO clubs (id, name, owner_user_id) 
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Demo Club',
  NULL
) ON CONFLICT DO NOTHING;

-- Create default categories for the demo club
INSERT INTO categories (club_id, key, label, order_index) VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'social', 'Social', 1),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'volunteer', 'Volunteer/Work', 2),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'fundraising', 'Fundraising', 3),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'work_week', 'Work this week', 4),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'work_signup', 'Signed up for work', 5),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'volunteer_signup', 'Signed up for volunteering', 6),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'attendance', 'Attendance', 7),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'points', 'Points', 8),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'admin', 'Admin', 9)
ON CONFLICT (club_id, key) DO NOTHING;

-- Also create global default categories (club_id = NULL) for new clubs
INSERT INTO categories (club_id, key, label, order_index) VALUES
  (NULL, 'social', 'Social', 1),
  (NULL, 'volunteer', 'Volunteer/Work', 2),
  (NULL, 'fundraising', 'Fundraising', 3),
  (NULL, 'work_week', 'Work this week', 4),
  (NULL, 'work_signup', 'Signed up for work', 5),
  (NULL, 'volunteer_signup', 'Signed up for volunteering', 6),
  (NULL, 'attendance', 'Attendance', 7),
  (NULL, 'points', 'Points', 8),
  (NULL, 'admin', 'Admin', 9)
ON CONFLICT (club_id, key) DO NOTHING;

