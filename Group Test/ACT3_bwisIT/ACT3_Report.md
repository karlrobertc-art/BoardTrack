Activity3 - Group 8 Campus Canteen System Installation and Testing
Report

Overall Status: Passed\
Testing Date: November 7, 2026\
Testing Environment: Windows (PowerShell 5.1, Java 21.0.13, Maven
3.10.0, PostgreSQL 18.6)\
Project Source:
`bwisIT-Solutions-Campus-Canteen-Pre-Order-and-Queue-Management-System`

Installation and Environment Verification

The Group 8 Campus Canteen application was obtained from the group's
GitHub repository and tested in a separate local environment. The
installation and execution process used an isolated PostgreSQL database
(`canteen_g8_test`) to verify database initialization and backend
connectivity without affecting the other databases on the computer.

The system was evaluated based on PostgreSQL role and schema setup,
sample data initialization, backend execution, API response, and
role-based access testing. The database setup completed successfully,
and the Spring Boot backend was launched locally using Java 21 and
Maven. The application started successfully and served API requests on
port 8080.

Setup Notes and Technical Observations

During testing, the application was evaluated using Student, Vendor, and
Administrator accounts. The role-based access tests confirmed that users
could access permitted routes, while requests to restricted routes and
requests made without authentication were denied. An inactive vendor
account was also unable to log in.

One observation involved the HTTP status returned when an authenticated
user attempted to access a route outside their assigned role. The
application returned `401 Unauthorized`. Although access was correctly
denied, returning `403 Forbidden` would more clearly indicate that the
user is authenticated but does not have permission to access the
requested resource.

The vendor activation test was also completed. The public vendor count
was four before Stall 5 was deactivated, decreased to three after
deactivation, and returned to four after Stall 5 was activated again.
This confirmed that the stall's activation setting affected its
visibility in the public vendor results. Stall 5 was restored to its
active state after the test.

Conclusion

The Group 8 Campus Canteen application successfully completed the local
installation and testing procedures performed during this evaluation.
The system demonstrated successful database initialization, backend
startup, API response, and role-based access control. The vendor
activation test also produced the expected change in the number of
publicly listed stalls.

The testing results indicate that the application operates successfully
in the tested local environment. The main recommendation is to consider
using `403 Forbidden` for authenticated users who attempt to access
resources outside their assigned roles, as this would provide a more
precise indication of an authorization restriction.
