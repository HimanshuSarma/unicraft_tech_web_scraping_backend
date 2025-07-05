https://docs.google.com/forms/u/0/d/e/1FAIpQLSdlGK5TemqKwR-bWE5TTNqkUBvlMpBFx-t-RsnrWONQbHpM1g/formResponse

https://docs.google.com/document/d/1UGtH7vResTvmk5jFErHq9yJZJQSjNrUuiC1cHXNnNRE/edit?tab=t.0


Features:
  *. Clone the github repo: https://github.com/HimanshuSarma/unicraft_tech_web_scraping_backend.git on your machine
  *. Run "npm run dev" to run the server. You must have nodejs installed on your machine.
  *. Implemented the endpoint http://localhost:8000/getCompanyDetails (POST)
  *. The body of the endpoint is as follows:
    {
      urls: "top 10 cloud companies in the word" (A custom string query)
    } 
    OR
    {
      urls:  ["https://clutch.co/us/web-developers"] (An array of urls)
    } 
  *. The response will be an array containing the company details found in each website
  *. I used @xenova/transformers(to parse company details found in each page). The results right now
    are not very accurate and I would need some more time to extract the company details more accurately.
    But, I think the results are good enough.
  *. The endpoint is returning company details like company name, tech stack, contact info, websites etc.
  *. I also implemented rate limiting with a redis instance so avoid overwhelming the server from the same client.
  *. I also implemented some random delay between subsequent page scrapes.
  *. Hit this endpoint(http://localhost:8000/getCompanyDetails (POST)) with a query like: "top 10 cloud companies in the word"  