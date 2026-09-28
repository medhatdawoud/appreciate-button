-- Clicks per button per UTC day, for the leaderboard's periods (today, this
-- week, ...). items.total_count stays the all-time count; this only dates it.
CREATE TABLE button_days (
  button_id CHAR(36) NOT NULL,
  day DATE NOT NULL,
  clicks INT NOT NULL DEFAULT 0,
  PRIMARY KEY (button_id, day),
  KEY idx_button_days_day (day, button_id)
)
