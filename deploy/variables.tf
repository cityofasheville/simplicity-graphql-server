variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "subnet_ids" {
  type          = list(string)
  description   = "Array of subnet ids"
}

variable "security_group_ids" {
  type          = list(string)
  description   = "Array of security_group_ids" 
}

variable "dbhost" {
 type = string
 description = "DB Env Var"
}

variable "dbuser" {
 type = string
 description = "DB Env Var"
}

variable "dbpassword" {
 type = string
 description = "DB Env Var"
}

variable "database" {
 type = string
 description = "DB Env Var"
}

variable "dbhost_accela" {
 type = string
 description = "DB Env Var"
}

variable "dbuser_accela" {
 type = string
 description = "DB Env Var"
}

variable "dbpassword_accela" {
 type = string
 description = "DB Env Var"
}

variable "dbdomain_accela" {
 type = string
 description = "DB Env Var"
}

variable "database_accela" {
 type = string
 description = "DB Env Var"
}