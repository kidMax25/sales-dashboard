library(shiny)
library(tidyverse)
library(lubridate)

calculate_sales_trend <- function(filtered_data) {
  if (is.null(filtered_data) || nrow(filtered_data) == 0) {
    return(list(
      daily = list(),
      summary = list(
        total_revenue = 0,
        total_orders = 0,
        date_range = "N/A"
      )
    ))
  }
  
  # Calculate daily aggregates
  daily_data <- filtered_data %>%
    mutate(
      date = as.Date(`Order Date`),
      line_total = Quantity * `Unit Price` * (1 - Discount)
    ) %>%
    filter(!is.na(date)) %>%
    group_by(date) %>%
    summarise(
      revenue = sum(line_total, na.rm = TRUE),
      orders = n_distinct(`Order ID`),
      items = sum(Quantity, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    arrange(date) %>%
    mutate(
      # Add temporal components for JS to use
      year = year(date),
      month = month(date),
      quarter = quarter(date),
      month_name = format(date, "%b %Y"),  # "Jan 2024"
      quarter_name = paste0("Q", quarter, " ", year)  # "Q1 2024"
    )
  
  # Convert to list of lists for JS
  daily_list <- lapply(1:nrow(daily_data), function(i) {
    list(
      date = as.character(daily_data$date[i]),
      revenue = round(daily_data$revenue[i], 2),
      orders = as.integer(daily_data$orders[i]),
      items = as.integer(daily_data$items[i]),
      year = as.integer(daily_data$year[i]),
      month = as.integer(daily_data$month[i]),
      quarter = as.integer(daily_data$quarter[i]),
      month_name = daily_data$month_name[i],
      quarter_name = daily_data$quarter_name[i]
    )
  })
  
  # Summary stats
  summary_stats <- list(
    total_revenue = sum(daily_data$revenue, na.rm = TRUE),
    total_orders = sum(daily_data$orders, na.rm = TRUE),
    total_items = sum(daily_data$items, na.rm = TRUE),
    date_range = if (nrow(daily_data) > 0) {
      paste(
        format(min(daily_data$date), "%b %d, %Y"),
        "to",
        format(max(daily_data$date), "%b %d, %Y")
      )
    } else {
      "N/A"
    },
    days = nrow(daily_data)
  )
  
  cat("Sales trend data calculated:\n")
  cat("  - Days with data:", nrow(daily_data), "\n")
  cat("  - Date range:", summary_stats$date_range, "\n")
  cat("  - Total revenue:", summary_stats$total_revenue, "\n")
  
  # Return complete data structure
  result <- list(
    daily = daily_list,
    summary = summary_stats
  )
  
  return(result)
}