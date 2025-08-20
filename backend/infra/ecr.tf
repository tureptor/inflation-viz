resource "aws_ecr_repository" "data-pipeline" {
  name = "cpih_json_exporter"

  tags = merge(
    local.common_tags,
    {
      Name    = "inflation-viz-ecr"
      Purpose = "Container images for data-pipeline of inflation-viz"
    }
  )
}