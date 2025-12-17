# R/modules/product_data.R
# ============================================
# PRODUCT DATA MODULE
# ============================================
# Aggregates product data for charts

library(shiny)
library(tidyverse)
library(jsonlite)

calculate_product_data <- function(filtered_data) {
  if (is.null(filtered_data) || nrow(filtered_data) == 0) {
    return(list(
      category_distribution = list(),
      top_products = list(),
      latest_sales = list()
    ))
  }
  
  # 1. CATEGORY DISTRIBUTION (for donut chart)
  category_dist <- filtered_data %>%
    mutate(line_total = Quantity * `Unit Price` * (1 - Discount)) %>%
    group_by(Category) %>%
    summarise(sales = sum(line_total, na.rm = TRUE),
              .groups = 'drop') %>%
    arrange(desc(sales)) %>%
    mutate(category = if_else(is.na(Category) |
                                Category == "", "Unknown", Category)) %>%
    select(category, sales)
  
  # Convert to list of lists for JS
  category_list <- lapply(1:nrow(category_dist), function(i) {
    list(category = category_dist$category[i],
         sales = round(category_dist$sales[i], 2))
  })
  
  # 2. TOP PRODUCTS (for bar chart) - Top 10
  top_products <- filtered_data %>%
    mutate(line_total = Quantity * `Unit Price` * (1 - Discount)) %>%
    group_by(`Product Name`) %>%
    summarise(sales = sum(line_total, na.rm = TRUE),
              .groups = 'drop') %>%
    arrange(desc(sales)) %>%
    head(10) %>%
    mutate(
      product_clean = trimws(gsub(
        "Northwind Traders", "", `Product Name`, fixed = TRUE
      )),
      product = if_else(
        is.na(product_clean) | product_clean == "",
        "Unknown",
        product_clean
      )
    ) %>%
    select(product, sales)
  
  # Convert to list of lists for JS
  products_list <- lapply(1:nrow(top_products), function(i) {
    list(product = top_products$product[i],
         sales = round(top_products$sales[i], 2))
  })
  
  # 3. LATEST SALES (for list) - Last 10 orders
  icons <- read.csv("www/resources/icons.csv")
  
  latest_sales <- filtered_data %>%
    mutate(line_total = Quantity * `Unit Price` * (1 - Discount)) %>%
    arrange(desc(`Order Date`), desc(`Order ID`)) %>%
    head(7) %>%
    left_join(icons, by = c("Product Name" = "Product.Name")) %>%
    mutate(
      product_clean = trimws(gsub(
        "Northwind Traders", "", `Product Name`, fixed = TRUE
      )),
      product = if_else(
        is.na(product_clean) | product_clean == "",
        "Unknown",
        product_clean
      ),
      category = if_else(is.na(Category) |
                           Category == "", "Unknown", Category)
    ) %>%
    select(product, category, quantity = Quantity, total = line_total, icon = Icon.Link) %>%
    arrange(desc(total))
  
  # Convert to list of lists for JS
  sales_list <- lapply(1:nrow(latest_sales), function(i) {
    list(
      product = latest_sales$product[i],
      category = latest_sales$category[i],
      quantity = as.integer(latest_sales$quantity[i]),
      total = round(latest_sales$total[i], 2),
      icon = latest_sales$icon[i]
    )
  })
  
  # Return complete data structure
  result <- list(
    category_distribution = category_list,
    top_products = products_list,
    latest_sales = sales_list
  )
  
  cat("Product data calculated:\n")
  cat("  - Categories:", length(category_list), "\n")
  cat("  - Top products:", length(products_list), "\n")
  cat("  - Latest sales:", length(sales_list), "\n")
  
  return(result)
}