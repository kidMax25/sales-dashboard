# ============================================
# KPIs MODULE - Dynamic KPI Updates
# ============================================
# No namespacing - continuous reactive component

library(shiny)
library(tidyverse)

source("data/database_operations.R")

# ============================================
# RENDER KPI CARDS
# ============================================
# Updates KPI values based on filtered data

render_kpi_cards <- function(output, filtered_data) {
  
  output$kpi_cards <- renderUI({
    
    # Get KPIs from filtered data
    kpis <- get_kpis(filtered_data())
    
    # Format values
    revenue_formatted <- scales::dollar(kpis$total_revenue, accuracy = 0.1, scale = 1e-6, suffix = "M")
    orders_formatted <- scales::comma(kpis$total_orders)
    avg_order_formatted <- scales::dollar(kpis$average_order_value)
    shipped_formatted <- scales::comma(kpis$total_shipped)
    
    # Calculate percentage shipped
    shipped_pct <- if (kpis$total_orders > 0) {
      round((kpis$total_shipped / kpis$total_orders) * 100)
    } else {
      0
    }
    
    tags$div(
      class = "grid grid-cols-2 lg:grid-cols-4 gap-4",
      style = "margin-top: 28px",
      
      # Total Revenue
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        tags$div(
          class = "flex items-center justify-between mb-2",
          tags$span(
            class = "text-sm font-medium text-gray-600",
            "Total Revenue"
          ),
          tags$svg(
            class = "w-5 h-5 text-green-500",
            fill = "none",
            stroke = "currentColor",
            viewBox = "0 0 24 24",
            tags$path(
              `stroke-linecap` = "round",
              `stroke-linejoin` = "round",
              `stroke-width` = "2",
              d = "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            )
          )
        ),
        tags$div(
          class = "text-2xl font-bold text-gray-800",
          revenue_formatted
        ),
        tags$div(
          class = "text-xs text-gray-500 mt-1",
          paste(orders_formatted, "orders")
        )
      ),
      
      # Total Orders
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        tags$div(
          class = "flex items-center justify-between mb-2",
          tags$span(
            class = "text-sm font-medium text-gray-600",
            "Total Orders"
          ),
          tags$svg(
            class = "w-5 h-5 text-blue-500",
            fill = "none",
            stroke = "currentColor",
            viewBox = "0 0 24 24",
            tags$path(
              `stroke-linecap` = "round",
              `stroke-linejoin` = "round",
              `stroke-width` = "2",
              d = "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            )
          )
        ),
        tags$div(
          class = "text-2xl font-bold text-gray-800",
          orders_formatted
        ),
        tags$div(
          class = "text-xs text-blue-600 mt-1",
          "Unique orders"
        )
      ),
      
      # Average Order Value
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        tags$div(
          class = "flex items-center justify-between mb-2",
          tags$span(
            class = "text-sm font-medium text-gray-600",
            "Avg Order Value"
          ),
          tags$svg(
            class = "w-5 h-5 text-purple-500",
            fill = "none",
            stroke = "currentColor",
            viewBox = "0 0 24 24",
            tags$path(
              `stroke-linecap` = "round",
              `stroke-linejoin` = "round",
              `stroke-width` = "2",
              d = "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            )
          )
        ),
        tags$div(
          class = "text-2xl font-bold text-gray-800",
          avg_order_formatted
        ),
        tags$div(
          class = "text-xs text-purple-600 mt-1",
          "Per order"
        )
      ),
      
      # Total Shipped
      tags$div(
        class = "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        tags$div(
          class = "flex items-center justify-between mb-2",
          tags$span(
            class = "text-sm font-medium text-gray-600",
            "Total Shipped"
          ),
          tags$svg(
            class = "w-5 h-5 text-orange-500",
            fill = "none",
            stroke = "currentColor",
            viewBox = "0 0 24 24",
            tags$path(
              d = "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
            ),
            tags$path(
              `stroke-linecap` = "round",
              `stroke-linejoin` = "round",
              `stroke-width` = "2",
              d = "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
            )
          )
        ),
        tags$div(
          class = "text-2xl font-bold text-gray-800",
          shipped_formatted
        ),
        tags$div(
          class = "text-xs text-orange-600 mt-1",
          paste0(shipped_pct, "% of total orders")
        )
      )
    )
  })
}