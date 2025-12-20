get_data <- function() {
  source("data/database_connect.R")
  
  loader <- tryCatch({
    database_connect()
    cat("Data Connection Successful\n")
    TRUE
  }, error = function(e) {
    cat("Failed to load data, error: ", e$message, "\n")
    FALSE
  })
  
  if (!loader) {
    cat("Failed to Load Data\n")
    return(NULL)
  }
  
  data <- tryCatch({
    readRDS("data/data.rds")
  }, error = function(e) {
    cat("Failed to read RDS file:", e$message, "\n")
    return(NULL)
  })
  
  if (is.null(data)) {
    return(NULL)
  }
  
  cat("Data Loaded Successfully\n")
  
  ## Unnest Data
 library(tidyverse)
  
  data_unlist <- map(data, as_tibble)
  
  # Extract tables
  Orders <- data_unlist$Orders
  OrderDetails <- data_unlist$`Order Details`
  Products <- data_unlist$Products
  Employees <- data_unlist$Employees
  
  ## Create Sales Data with all joins
  sales_data <- Orders %>%
    left_join(OrderDetails, by = c("Order ID" = "Order ID")) %>%
    left_join(Products, by = c("Product ID" = "ID")) %>%
    left_join(Employees, by = c("Employee ID" = "ID"))
  
  cat("Sales data created: ", nrow(sales_data), " rows\n")
  
  return(sales_data)
}


get_kpis <- function(sales_data) {
  
  if (is.null(sales_data) || nrow(sales_data) == 0) {
    return(list(
      total_revenue = 0,
      total_orders = 0,
      average_order_value = 0,
      total_shipped = 0
    ))
  }
  
  # Total Revenue
  total_revenue <- sales_data %>%
    mutate(line_total = Quantity * `Unit Price` * (1 - Discount)) %>%
    summarise(total = sum(line_total, na.rm = TRUE)) %>%
    pull(total)
  
  # Total Orders (unique order IDs)
  total_orders <- sales_data %>%
    distinct(`Order ID`) %>%
    nrow()
  
  # Average Order Value
  average_order_value <- sales_data %>%
    mutate(line_total = Quantity * `Unit Price` * (1 - Discount)) %>%
    group_by(`Order ID`) %>%
    summarise(order_total = sum(line_total, na.rm = TRUE)) %>%
    summarise(average = mean(order_total, na.rm = TRUE)) %>%
    pull(average)
  
  # Total Shipped
  total_shipped <- sales_data %>%
    filter(!is.na(`Shipped Date`)) %>%
    distinct(`Order ID`) %>%
    nrow()
  
  kpis <- list(
    total_revenue = total_revenue,
    total_orders = total_orders,
    average_order_value = average_order_value,
    total_shipped = total_shipped
  )
  
  return(kpis)
}