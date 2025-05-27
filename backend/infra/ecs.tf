resource "aws_ecs_cluster" "main" {
  name = "cpih_json_exporter_cluster"

  tags = merge(
    local.common_tags,
    {
      Name    = "inflation-viz-ecs-cluster"
      Purpose = "ECS cluster for inflation-viz"
    }
  )
}