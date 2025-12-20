FROM rocker/shiny:latest

# Install system dependencies for R packages (tidyverse, ragg, textshaping)
# We add libharfbuzz-dev, libfribidi-dev, libfreetype6-dev, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo \
    libssl-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    # Required for ragg / textshaping / tidyverse
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfontconfig1-dev \
    # Required for RODBC / Access DB
    unixodbc-dev \
    odbc-mdbtools \
    mdbtools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /home/shiny-app
COPY . /home/shiny-app

# Install R packages
# Explicitly installing 'ragg' and 'textshaping' first helps catch errors early
RUN R -e "install.packages(c('ragg', 'textshaping'), repos='https://cran.rstudio.com/')"
RUN R -e "install.packages(c('shiny', 'jsonlite', 'tidyverse', 'lubridate', 'RODBC', 'dotenv', 'plotly', 'leaflet'), repos='https://cran.rstudio.com/')"

# Render uses the PORT environment variable
EXPOSE 10000

# Start the app
CMD ["Rscript", "run.R"]