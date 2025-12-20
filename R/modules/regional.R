
library(shiny)
library(tidyverse)

state_names <- c(
  "AL" = "Alabama", "AK" = "Alaska", "AZ" = "Arizona", "AR" = "Arkansas",
  "CA" = "California", "CO" = "Colorado", "CT" = "Connecticut", "DE" = "Delaware",
  "FL" = "Florida", "GA" = "Georgia", "HI" = "Hawaii", "ID" = "Idaho",
  "IL" = "Illinois", "IN" = "Indiana", "IA" = "Iowa", "KS" = "Kansas",
  "KY" = "Kentucky", "LA" = "Louisiana", "ME" = "Maine", "MD" = "Maryland",
  "MA" = "Massachusetts", "MI" = "Michigan", "MN" = "Minnesota", "MS" = "Mississippi",
  "MO" = "Missouri", "MT" = "Montana", "NE" = "Nebraska", "NV" = "Nevada",
  "NH" = "New Hampshire", "NJ" = "New Jersey", "NM" = "New Mexico", "NY" = "New York",
  "NC" = "North Carolina", "ND" = "North Dakota", "OH" = "Ohio", "OK" = "Oklahoma",
  "OR" = "Oregon", "PA" = "Pennsylvania", "RI" = "Rhode Island", "SC" = "South Carolina",
  "SD" = "South Dakota", "TN" = "Tennessee", "TX" = "Texas", "UT" = "Utah",
  "VT" = "Vermont", "VA" = "Virginia", "WA" = "Washington", "WV" = "West Virginia",
  "WI" = "Wisconsin", "WY" = "Wyoming", "DC" = "District of Columbia"
)

calculate_regional_data <- function(filtered_data) {
  if (is.null(filtered_data) || nrow(filtered_data) == 0) {
    return(list(
      states = list(),
      summary = list(
        total_orders = 0,
        total_states = 0,
        top_state = "N/A"
      )
    ))
  }
  
  # Aggregate by state
  state_data <- filtered_data %>%
    mutate(
      state_code = trimws(toupper(`Ship State/Province`)),
      line_total = Quantity * `Unit Price` * (1 - Discount)
    ) %>%
    filter(!is.na(state_code), state_code != "", nchar(state_code) == 2) %>%
    group_by(state_code) %>%
    summarise(
      orders = n_distinct(`Order ID`),
      revenue = sum(line_total, na.rm = TRUE),
      items_shipped = sum(Quantity, na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    arrange(desc(orders)) %>%
    mutate(
      # Add full state name
      state_name = state_names[state_code],
      state_name = if_else(is.na(state_name), state_code, state_name)
    ) %>%
    select(state_code, state_name, orders, revenue, items_shipped)
  
  # Convert to list of lists for JS
  states_list <- lapply(1:nrow(state_data), function(i) {
    list(
      state = state_data$state_code[i],
      state_name = state_data$state_name[i],
      orders = as.integer(state_data$orders[i]),
      revenue = round(state_data$revenue[i], 2),
      items = as.integer(state_data$items_shipped[i])
    )
  })
  
  # Calculate summary stats
  summary_stats <- list(
    total_orders = sum(state_data$orders, na.rm = TRUE),
    total_states = nrow(state_data),
    top_state = if (nrow(state_data) > 0) {
      paste0(state_data$state_name[1], " (", state_data$orders[1], " orders)")
    } else {
      "N/A"
    }
  )
  
  cat("Regional data calculated:\n")
  cat("  - States with orders:", nrow(state_data), "\n")
  cat("  - Total orders:", summary_stats$total_orders, "\n")
  cat("  - Top state:", summary_stats$top_state, "\n")
  
  result <- list(
    states = states_list,
    summary = summary_stats
  )
  
  return(result)
}