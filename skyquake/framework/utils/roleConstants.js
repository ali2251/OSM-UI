var c = {};

c.PLATFORM = {
  OPER: "rw-rbac-platform:platform-oper",
  ADMIN: "rw-rbac-platform:platform-admin",
  SUPER: "rw-rbac-platform:super-admin"
}

c.PROJECT = {
    TYPE: {
      "rw-project-mano:catalog-oper": "rw-project-mano",
      "rw-project-mano:catalog-admin": "rw-project-mano",
      "rw-project-mano:lcm-oper": "rw-project-mano",
      "rw-project-mano:lcm-admin": "rw-project-mano",
      "rw-project-mano:account-oper": "rw-project-mano",
      "rw-project-mano:account-admin": "rw-project-mano",
      "rw-project:project-oper": "rw-project",
      "rw-project:project-admin": "rw-project"
    },
    CATALOG_OPER: "rw-project-mano:catalog-oper",
    CATALOG_ADMIN: "rw-project-mano:catalog-admin",
    LCM_OPER: "rw-project-mano:lcm-oper",
    LCM_ADMIN: "rw-project-mano:lcm-admin",
    ACCOUNT_OPER: "rw-project-mano:account-oper",
    ACCOUNT_ADMIN: "rw-project-mano:account-admin",
    PROJECT_OPER: "rw-project:project-oper",
    PROJECT_ADMIN: "rw-project:project-admin"

}

module.exports = c;
