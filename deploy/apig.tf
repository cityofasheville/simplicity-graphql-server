resource "aws_apigatewayv2_api" "aws_apigatewayv2_api-${prog_name}" {
  name          = "simplicity-graphql-server-${prog_name}"
  protocol_type = "HTTP"
  target        = aws_lambda_function.${prog_name}.arn
  cors_configuration {
    allow_origins = ["*"]
  }
}

resource "aws_lambda_permission" "apigw-${prog_name}" {
  action        = "lambda:InvokeFunction"
	function_name = aws_lambda_function.${prog_name}.function_name
	principal     = "apigateway.amazonaws.com"

	source_arn = "${aws_apigatewayv2_api.aws_apigatewayv2_api-${prog_name}.execution_arn}/*/*"
}