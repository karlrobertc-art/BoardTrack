-- Sample data. Run on a freshly migrated database (ids rely on fresh sequences).
INSERT INTO property (property_name, address) VALUES
  ('Sunshine Boarding House', '12 Rizal St., Calamba, Laguna'),
  ('Greenview Apartments',    '45 Mabini Ave., Los Banos, Laguna');

INSERT INTO room (property_id, room_number, monthly_rate, status) VALUES
  (1,'101',3500,'AVAILABLE'), (1,'102',3500,'AVAILABLE'), (1,'103',4000,'AVAILABLE'),
  (2,'A1',5000,'AVAILABLE'),  (2,'A2',5000,'AVAILABLE'),  (2,'A3',5500,'MAINTENANCE');

INSERT INTO tenant (full_name, contact_number, email, valid_id_number) VALUES
  ('Juan Dela Cruz','09171234567','juan@example.com','STU-2023-0001'),
  ('Maria Santos',  '09181234567','maria@example.com','DL-N01-23-000123'),
  ('Pedro Reyes',   '09191234567', NULL,              'UMID-0001-2345'),
  ('Ana Lopez',     '09201234567','ana@example.com',  NULL);

INSERT INTO lease (tenant_id, room_id, start_date, end_date, moved_out_on, monthly_rent, status) VALUES
  (1,1,'2026-01-01','2026-12-31',NULL,        3500,'ACTIVE'),
  (2,2,'2026-02-01','2027-01-31',NULL,        3500,'ACTIVE'),
  (3,4,'2026-03-01','2027-02-28',NULL,        5000,'ACTIVE'),
  (4,1,'2025-01-01','2025-12-31','2025-11-30',3300,'TERMINATED');

INSERT INTO payment (lease_id, payment_date, amount, payment_method, status) VALUES
  (1,'2026-01-05',3500,'CASH','COMPLETED'),
  (1,'2026-02-05',3500,'GCASH','COMPLETED'),
  (1,'2026-03-07',3500,'GCASH','PENDING'),
  (2,'2026-02-03',3500,'CASH','COMPLETED'),
  (3,'2026-03-02',5000,'BANK_TRANSFER','COMPLETED'),
  (4,'2025-10-05',3300,'CASH','COMPLETED');

INSERT INTO utility_bill (lease_id, billing_period, utility_type, amount, status) VALUES
  (1,'2026-01-01','ELECTRICITY',420.50,'PAID'),
  (1,'2026-01-01','WATER',150.00,'PAID'),
  (2,'2026-02-01','ELECTRICITY',380.00,'UNPAID'),
  (3,'2026-03-01','INTERNET',700.00,'UNPAID');

-- DEMO accounts only; all use the sample password ChangeMe123! (see docs/user-roles.md).
INSERT INTO app_user (username, password_hash, role, tenant_id) VALUES
  ('landlord',  crypt('ChangeMe123!', gen_salt('bf')), 'admin',  NULL),
  ('caretaker', crypt('ChangeMe123!', gen_salt('bf')), 'staff',  NULL),
  ('juan',      crypt('ChangeMe123!', gen_salt('bf')), 'tenant', 1);
