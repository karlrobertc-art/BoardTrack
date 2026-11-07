Activity 4 – Group 8 bwisIT Campus Canteen System Database Access Control Report

Overall Status: Completed with one environment limitation  
Testing Date: November 7, 2026  
Testing Environment: Windows PowerShell 5.1, PostgreSQL 18.6  
Project: Group 8 – bwisIT Campus Canteen Pre-Order and Queue Management System  
Test Database: `canteen_g8_test`

--Database Access-Control Overview--

The Group 8 Campus Canteen system was evaluated using a separate local test database named `canteen_g8_test`. The database access-control configuration was reviewed to determine whether database roles followed the principle of least privilege.

The configuration includes the following roles:

- `canteen_admin` – database owner and administrative role.
- `canteen_app` – application runtime login role.
- `canteen_readonly` – read-only reporting login role.
- `canteen_app_grp` – non-login group role containing application privileges.
- `canteen_readonly_grp` – non-login group role containing reporting privileges.

The application and reporting roles do not have superuser, database-creation, or role-creation privileges. Both group roles have schema usage without schema creation privileges.

--Privilege Verification--

The privilege verification script, `08-privilege-verification.sql`, completed successfully with exit code 0.

The results confirmed the following:

- The application role can read and insert records in the seven application tables.
- The application role can update only the five tables specified in the access-control plan: `customer_order`, `menu_item`, `notification`, `queue_entry`, and `vendor`.
- The application role can delete from `menu_item` but cannot delete from `student` or other unapproved tables.
- The application role has the required sequence usage and select privileges.
- The read-only role has column-level SELECT privileges for approved reporting columns in `vendor`, `menu_item`, `customer_order`, and `order_item`.
- The read-only role cannot access the unapproved `student` table or perform write operations.
- Neither application nor read-only roles can create objects in the public schema.

--Access-Control Test Results--

The following tests were performed against `canteen_g8_test`:

| Test | Expected Result | Actual Result |
|---|---|---|
| Runtime menu read | Allowed | Passed |
| Runtime order insertion | Allowed | Passed |
| Runtime order update | Allowed | Passed |
| Read-only approved reporting queries | Allowed | Passed |
| Read-only INSERT | Denied | Passed |
| Read-only UPDATE | Denied | Passed |
| Read-only DELETE | Denied | Passed |
| Read-only TRUNCATE | Denied | Passed |
| Read-only access to `student` | Denied | Passed |
| Runtime DELETE from `student` | Denied | Passed |
| Runtime access to `pg_authid` | Denied | Passed |
| Runtime CREATE DATABASE | Denied | Passed |

The allowed runtime test completed successfully and rolled back its test transaction. The read-only denial tests also completed successfully with the expected permission-denied results.

--Environment Limitation--

The verification script found that `canteen_app` could connect to the unrelated PostgreSQL maintenance database named `postgres`.

This is caused by the default `PUBLIC CONNECT` privilege in the current PostgreSQL cluster. The cluster also contains other databases that are outside the scope of this Group 8 evaluation.

The cluster-wide security restriction script was not executed because it could revoke connection privileges across unrelated databases and affect other projects. This limitation is therefore documented rather than changing shared PostgreSQL permissions during the test.

--Conclusion--

The Group 8 database access-control configuration passed the tested role, table, schema, sequence, column-level, and runtime permission checks.

The application role demonstrated the expected permitted operations and was denied the tested restricted operations. The read-only role successfully performed approved reporting queries while being denied write operations and access to unapproved data.

One environment limitation remains regarding the default `PUBLIC CONNECT` privilege on the unrelated `postgres` database. This should be reviewed in a dedicated PostgreSQL test cluster or under an approved cluster-wide security plan.

Overall, the Group 8 access-control tests were successful, with the noted environment limitation documented for follow-up.