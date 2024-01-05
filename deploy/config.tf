terraform {
  backend "s3" {
    bucket = "avl-tfstate-store"
    key    = "terraform/simplicity_graphql_server/layer/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.region
}

# Zip file for Lambda Layer
data "archive_file" "simplicity_graphql_server_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/nodejs"
  output_path = "${path.module}/layer.zip"
}

# Lambda Layer
resource "aws_lambda_layer_version" "simplicity_graphql_server_layer" {
  filename   = "${path.module}/layer.zip"
  source_code_hash = data.archive_file.simplicity_graphql_server_layer_zip.output_base64sha256
  layer_name = "simplicity_graphql_server_layer"
}

output "simplicity_graphql_server_layer_arn" {
  value = aws_lambda_layer_version.simplicity_graphql_server_layer.arn
}

# Zip file for Lambda Function
data "archive_file" "simplicity_graphql_server_zip" {
  type        = "zip"
  source_dir  = "${path.module}/function"
  output_path = "${path.module}/function.zip"
}

# Lambda Function
resource "aws_lambda_function" "simplicity_graphql_server" {
  description      = "simplicity_graphql_server" 
  function_name    = "simplicity_graphql_server"
  role             = aws_iam_role.simplicity_graphql_server-role.arn
  handler          = "server.default"
  runtime          = "nodejs20.x"
  filename = data.archive_file.simplicity_graphql_server_zip.output_path
  source_code_hash = data.archive_file.simplicity_graphql_server_zip.output_base64sha256
  layers = [aws_lambda_layer_version.simplicity_graphql_server_layer.arn]
  # timeout          = 900
  # memory_size      = 256
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }
  tags = {
    Name          = "simplicity_graphql_server"
    "coa:application" = "simplicity_graphql_server"
    "coa:department"  = "information-technology"
    "coa:owner"       = "jtwilson@ashevillenc.gov"
    "coa:owner-team"  = "dev"
  }
}

output "simplicity_graphql_server_arn" {
  value = aws_lambda_function.simplicity_graphql_server.arn
}