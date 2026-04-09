-- Drop and recreate trigger for class_join_requests (if exists)
DROP TRIGGER IF EXISTS update_class_join_requests_updated_at ON class_join_requests;

-- Create trigger for updated_at
CREATE TRIGGER update_class_join_requests_updated_at BEFORE UPDATE ON class_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

