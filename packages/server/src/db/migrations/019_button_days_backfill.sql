-- Dates the clicks made before button_days existed, as an estimate: nothing
-- recorded when each click happened, so each visitor's clicks count on the
-- UTC day of their last one. Per button the sum equals items.total_count.
INSERT INTO button_days (button_id, day, clicks)
SELECT button_id, DATE(CONVERT_TZ(last_click_at, @@session.time_zone, '+00:00')), SUM(click_count)
  FROM visitor_clicks
 WHERE click_count > 0
 GROUP BY 1, 2
