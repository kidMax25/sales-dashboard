library(shiny)
library(tidyverse)

calculate_agent_data <- function(sales_data) {
  if (is.null(sales_data) || nrow(sales_data) == 0) {
    return(list(
      agents = list(),
      default_agent = NULL
    ))
  }
  
  # Extract unique agents with their details
  agents_df <- sales_data %>%
    distinct(`Employee ID`, `First Name`, `Last Name`, `Job Title`, `E-mail Address`) %>%
    filter(!is.na(`Employee ID`), !is.na(`First Name`), !is.na(`Last Name`)) %>%
    mutate(
      full_name = paste(`First Name`, `Last Name`),
      # Create portrait filename
      portrait = paste0(full_name, ".jpg"),
      # Clean email
      email = if_else(is.na(`E-mail Address`) | `E-mail Address` == "", 
                      "No email on file", 
                      `E-mail Address`),
      # Clean job title
      role = if_else(is.na(`Job Title`) | `Job Title` == "", 
                     "Sales Representative", 
                     `Job Title`)
    ) %>%
    arrange(full_name) %>%
    select(
      employee_id = `Employee ID`,
      first_name = `First Name`,
      last_name = `Last Name`,
      full_name,
      role,
      email,
      portrait
    )
  
  # Convert to list of lists for JS
  agents_list <- lapply(1:nrow(agents_df), function(i) {
    list(
      employee_id = as.character(agents_df$employee_id[i]),
      first_name = agents_df$first_name[i],
      last_name = agents_df$last_name[i],
      full_name = agents_df$full_name[i],
      role = agents_df$role[i],
      email = agents_df$email[i],
      portrait = agents_df$portrait[i]
    )
  })
  
  # Find Steven Thorpe as default (for "All Agents")
  default_agent <- agents_list[[1]]
  
  steven_idx <- which(sapply(agents_list, function(a) {
    a$full_name == "Steven Thorpe"
  }))
  
  if (length(steven_idx) > 0) {
    default_agent <- agents_list[[steven_idx[1]]]
    cat("Found Steven Thorpe as default agent\n")
  } else {
    cat("Steven Thorpe not found, using first agent as default\n")
  }
  
  cat("Agent data calculated:\n")
  cat("  - Total agents:", length(agents_list), "\n")
  cat("  - Default agent:", default_agent$full_name, "\n")
  
  # Return complete data structure
  result <- list(
    agents = agents_list,
    default_agent = default_agent
  )
  
  return(result)
}