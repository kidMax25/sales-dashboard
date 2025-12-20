library(shiny)
library(tidyverse)

calculate_agent_performance <- function(sales_data) {
  if (is.null(sales_data) || nrow(sales_data) == 0) {
    return(list())
  }
  
  agent_performance <- sales_data %>%
    mutate(line_total = Quantity * `Unit Price` * (1 - Discount)) %>%
    group_by(`Employee ID`, `First Name`, `Last Name`) %>%
    summarise(
      revenue = sum(line_total, na.rm = TRUE),
      orders = n_distinct(`Order ID`),
      items_sold = sum(Quantity, na.rm = TRUE),
      avg_order_value = mean(line_total, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    filter(!is.na(`Employee ID`)) %>%
    arrange(desc(revenue))
  
  performance_list <- lapply(1:nrow(agent_performance), function(i) {
    list(
      employee_id = as.character(agent_performance$`Employee ID`[i]),
      revenue = round(agent_performance$revenue[i], 2),
      orders = as.integer(agent_performance$orders[i]),
      items_sold = as.integer(agent_performance$items_sold[i]),
      avg_order_value = round(agent_performance$avg_order_value[i], 2)
    )
  })
  
  cat("Agent performance calculated:\n")
  cat("  - Agents:", length(performance_list), "\n")
  cat("  - Top performer:", agent_performance$`First Name`[1], 
      agent_performance$`Last Name`[1], 
      "($", round(agent_performance$revenue[1], 0), ")\n")
  
  return(performance_list)
}