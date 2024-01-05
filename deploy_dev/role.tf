resource "aws_iam_role" "simplicity_graphql_server_dev-role" {
    name = "simplicity_graphql_server_dev-role"
    assume_role_policy = file("./policy_role.json")
    tags = {
      Name          = "simplicity_graphql_server_dev-role"
      "coa:application" = "simplicity_graphql_server_dev"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
      Description   = "Role used by simplicity_graphql_server_dev lambda function."
    }
}

# Lambda Basic Execution
resource "aws_iam_role_policy_attachment" "lambda_basic-simplicity_graphql_server_dev" {
    role        = aws_iam_role.simplicity_graphql_server_dev-role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC (databases)
resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
    role        = aws_iam_role.simplicity_graphql_server_dev-role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Secrets Manager
resource "aws_iam_policy" "secrets_manager_policy-simplicity_graphql_server_dev" {
  name        = "secrets_manager_policy-simplicity_graphql_server_dev"
  description = "Read secrets"
  policy = templatefile("./policy_secrets_manager.json",{})
}
resource "aws_iam_role_policy_attachment" "secrets_manager" {
    role        = aws_iam_role.simplicity_graphql_server_dev-role.name
    policy_arn  = aws_iam_policy.secrets_manager_policy-simplicity_graphql_server_dev.arn
}

# S3
resource "aws_iam_role_policy_attachment" "lambda_s3_access-simplicity_graphql_server_dev" {
    role        = aws_iam_role.simplicity_graphql_server_dev-role.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# 

output "simplicity_graphql_server_dev_role_arn" {
  value = "${aws_iam_role.simplicity_graphql_server_dev-role.arn}"
}