terraform {
  backend "s3" {
    bucket = "avl-tfstate-store"
    key    = "terraform/${prog_name}/layer/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.region
}

# Zip file for Lambda Layer
data "archive_file" "${prog_name}_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/nodejs"
  output_path = "${path.module}/layer.zip"
}

# Lambda Layer
resource "aws_lambda_layer_version" "${prog_name}_layer" {
  filename   = "${path.module}/layer.zip"
  source_code_hash = data.archive_file.${prog_name}_layer_zip.output_base64sha256
  layer_name = "${prog_name}_layer"
}

output "${prog_name}_layer_arn" {
  value = aws_lambda_layer_version.${prog_name}_layer.arn
}

# Zip file for Lambda Function
data "archive_file" "${prog_name}_zip" {
  type        = "zip"
  source_dir  = "${path.module}/funcdir"
  output_path = "${path.module}/function.zip"
}

# Lambda Function
resource "aws_lambda_function" "${prog_name}" {
  description      = "${prog_name}" 
  function_name    = "${prog_name}"
  role             = aws_iam_role.${prog_name}-role.arn
  handler          = "lambda.default"
  runtime          = "nodejs20.x"
  filename = data.archive_file.${prog_name}_zip.output_path
  source_code_hash = data.archive_file.${prog_name}_zip.output_base64sha256
  layers = [aws_lambda_layer_version.${prog_name}_layer.arn]
  timeout          = 30
  memory_size      = 180
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }
  tags = {
    Name          = "${prog_name}"
    "coa:application" = "${prog_name}"
    "coa:department"  = "information-technology"
    "coa:owner"       = "jtwilson@ashevillenc.gov"
    "coa:owner-team"  = "dev"
  }
  environment {
    variables = {
      "dbhost": var.dbhost
      "dbuser": var.dbuser
      "dbpassword": var.dbpassword
      "database": var.database
      "debug": var.debug
    }
  }
}

resource "aws_apigatewayv2_api" "${prog_name}" {
  name          = "${prog_name}"
  protocol_type = "HTTP"
  target        = aws_lambda_function.${prog_name}.arn
  tags = {
    Name          = "${prog_name}"
    "coa:application" = "${prog_name}"
    "coa:department"  = "information-technology"
    "coa:owner"       = "jtwilson@ashevillenc.gov"
    "coa:owner-team"  = "dev"
  }
  cors_configuration {
    allow_headers     = ["*"]
    allow_methods     = ["POST", "GET"]
    allow_origins     = ["*"]
    expose_headers    = ["*"]
    max_age           = 300
  }
}

resource "aws_apigatewayv2_domain_name" "domain-name-${prog_name}" {
  domain_name = var.domain_name
  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "apigw-map-${prog_name}" {
  api_id      = aws_apigatewayv2_api.${prog_name}.id
  domain_name = var.domain_name
  stage       = "$default"
}

resource "aws_lambda_permission" "apigw-${prog_name}" {
  action        = "lambda:InvokeFunction"
	function_name = aws_lambda_function.${prog_name}.function_name
	principal     = "apigateway.amazonaws.com"
	source_arn = "${aws_apigatewayv2_api.${prog_name}.execution_arn}/*/*"
}

output "${prog_name}_arn" {
  value = aws_lambda_function.${prog_name}.arn
}

output "${prog_name}_api_url" {
  value = aws_apigatewayv2_domain_name.domain-name-${prog_name}.domain_name
}

output "${prog_name}_api_id" {
  value = aws_apigatewayv2_api.${prog_name}.id
}