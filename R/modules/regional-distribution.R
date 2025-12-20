# R/modules/regional-distribution.R

library(shiny)
library(tidyverse)

calculate_regional_distribution <- function(filtered_data) {
  if (is.null(filtered_data) || nrow(filtered_data) == 0) {
    return(list(
      hierarchy = list(),
      summary = list(
        total_revenue = 0,
        total_cities = 0
      )
    ))
  }
  
  # Calculate line totals
  data_with_totals <- filtered_data %>%
    mutate(
      line_total = Quantity * `Unit Price` * (1 - Discount),
      # Clean data
      city = if_else(is.na(`Ship City`) | `Ship City` == "", "Unknown City", `Ship City`),
      state = if_else(is.na(`Ship State/Province`) | `Ship State/Province` == "", "Unknown", `Ship State/Province`),
      zip = if_else(is.na(`Ship ZIP/Postal Code`) | `Ship ZIP/Postal Code` == 0, "00000", as.character(`Ship ZIP/Postal Code`)),
      address = if_else(is.na(`Ship Address`) | `Ship Address` == "", "Unknown Address", `Ship Address`)
    )

  hierarchy_data <- data_with_totals %>%
    group_by(city, state, zip) %>%
    summarise(
      revenue = sum(line_total, na.rm = TRUE),
      orders = n_distinct(`Order ID`),
      items = sum(Quantity, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    arrange(desc(revenue))
  
  # Root node
  labels <- c("USA")
  parents <- c("")
  values <- c(sum(hierarchy_data$revenue, na.rm = TRUE))
  orders_list <- c(sum(hierarchy_data$orders, na.rm = TRUE))
  items_list <- c(sum(hierarchy_data$items, na.rm = TRUE))
  
  # City level (children of USA)
  city_summary <- hierarchy_data %>%
    group_by(city) %>%
    summarise(
      revenue = sum(revenue, na.rm = TRUE),
      orders = sum(orders, na.rm = TRUE),
      items = sum(items, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    arrange(desc(revenue))
  
  labels <- c(labels, city_summary$city)
  parents <- c(parents, rep("USA", nrow(city_summary)))
  values <- c(values, city_summary$revenue)
  orders_list <- c(orders_list, city_summary$orders)
  items_list <- c(items_list, city_summary$items)
  
  # State level (children of Cities)
  state_summary <- hierarchy_data %>%
    group_by(city, state) %>%
    summarise(
      revenue = sum(revenue, na.rm = TRUE),
      orders = sum(orders, na.rm = TRUE),
      items = sum(items, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    arrange(desc(revenue))
  
  labels <- c(labels, paste(state_summary$state, state_summary$city, sep = " - "))
  parents <- c(parents, state_summary$city)
  values <- c(values, state_summary$revenue)
  orders_list <- c(orders_list, state_summary$orders)
  items_list <- c(items_list, state_summary$items)
  
  # ZIP level (children of State-City combinations)
  zip_summary <- hierarchy_data %>%
    mutate(parent_label = paste(state, city, sep = " - ")) %>%
    select(parent_label, zip, revenue, orders, items)
  
  labels <- c(labels, paste(zip_summary$zip, zip_summary$parent_label, sep = " @ "))
  parents <- c(parents, zip_summary$parent_label)
  values <- c(values, zip_summary$revenue)
  orders_list <- c(orders_list, zip_summary$orders)
  items_list <- c(items_list, zip_summary$items)
  
  # Summary stats
  summary_stats <- list(
    total_revenue = sum(hierarchy_data$revenue, na.rm = TRUE),
    total_cities = n_distinct(hierarchy_data$city),
    total_states = n_distinct(hierarchy_data$state),
    total_zips = n_distinct(hierarchy_data$zip)
  )
  
  cat("Regional distribution calculated:\n")
  cat("  - Cities:", summary_stats$total_cities, "\n")
  cat("  - States:", summary_stats$total_states, "\n")
  cat("  - ZIP codes:", summary_stats$total_zips, "\n")
  cat("  - Total revenue:", summary_stats$total_revenue, "\n")
  
  # Return data structure
  result <- list(
    hierarchy = list(
      labels = labels,
      parents = parents,
      values = values,
      orders = orders_list,
      items = items_list
    ),
    summary = summary_stats
  )
  
  return(result)
}