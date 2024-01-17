resource "aws_iam_role" "${prog_name}-role" {
    name = "${prog_name}-role"
    assume_role_policy = file("./policy_role.json")
    tags = {
      Name          = "${prog_name}-role"
      "coa:application" = "${prog_name}"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
      Description   = "Role used by ${prog_name} lambda function."
    }
}

# Lambda Basic Execution
resource "aws_iam_role_policy_attachment" "lambda_basic-${prog_name}" {
    role        = aws_iam_role.${prog_name}-role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC (databases)
resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
    role        = aws_iam_role.${prog_name}-role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Secrets Manager
resource "aws_iam_policy" "secrets_manager_policy-${prog_name}" {
  name        = "secrets_manager_policy-${prog_name}"
  description = "Read secrets"
  policy = templatefile("./policy_secrets_manager.json",{})
}
resource "aws_iam_role_policy_attachment" "secrets_manager" {
    role        = aws_iam_role.${prog_name}-role.name
    policy_arn  = aws_iam_policy.secrets_manager_policy-${prog_name}.arn
}

# S3
resource "aws_iam_role_policy_attachment" "lambda_s3_access-${prog_name}" {
    role        = aws_iam_role.${prog_name}-role.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# 

output "${prog_name}_role_arn" {
  value = "${aws_iam_role.${prog_name}-role.arn}"
}