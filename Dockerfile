FROM rocker/shiny:latest

# Install system dependencies for R packages and Access DB support
RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo libssl-dev libxml2-dev libcurl4-openssl-dev \
    unixodbc-dev odbc-mdbtools mdbtools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /home/shiny-app
COPY . /home/shiny-app

# Install R packages
RUN R -e "install.packages(c('shiny', 'jsonlite', 'tidyverse', 'lubridate', 'RODBC', 'dotenv', 'plotly', 'leaflet'), repos='https://cran.rstudio.com/')"

# Render uses the PORT environment variable
EXPOSE 10000

# Start the app using run.R
CMD ["Rscript", "run.R"]