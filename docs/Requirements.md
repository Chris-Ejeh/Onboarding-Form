# Onboarding Form

### Prerequisites:

- Code should be in repository on any of the available git services (Github,
  Bitbucket, Gitlab, etc.)
- Writing code according to standard architectural and design patterns in React
  js is required
- Essential parts should be covered with automated integration tests (react
  testing library preferred)
- Should be written ideally in Typescript (Javascript allowed as well) using React
  library
  - Using react hooks (including custom hooks)
- External libraries (design systems, styles, form validations, validation schema
  (yup, zod), UI components) are allowed and encouraged
- ESlint configuration is optional, but nice to have
- Vite or Next.js can be used (optionally)
- Use the given designs as a guide (end of the file)

**Disclaimer**: Please read and follow all instructions. Treat the submissions as
though it is production ready code - where code is properly in abstracted files,
DRY and ready to be PR reviewed.

**Challenge**: Build a simple onboarding form where user can type their personal
and business details.

- User should be able to:
  - Type a first name (size limit 50 chars)
  - Type a last name (size limit 50 chars)
  - Type a phone number (validate if phone number is correct, only Canadian numbers are allowed). Phone number shouldn’t contain any special characters except + at the beginning. Should start with country code +1 .
  - Type a corporation number. Length should be 9 chars, should be validated asynchronously by making GET request to a given endpoint. URL: https://fe-hometask-api.qa.vault.tryvault.com/corporation-number:number . For correct corporation number response will be for example:

  ```
  {
      "corporationNumber": "123456789",
      "valid": true
  }
  ```

  for bad corporation number there will be:

  ```
  {
      "valid": false,
      "message": "Invalid corporation number"
  }
  ```

  List of valid corporation numbers (do not hardcode it, only for testing purpose):

  ```
  [
      "826417395",
      "158739264",
      "123456789",
      "591863427",
      "312574689",
      "287965143",
      "265398741",
      "762354918",
      "468721395",
      "624719583",
  ]
  ```

  - All of the above form fields are required and appropriate validation should occur onBlur (including validation of corporation number via API)
  - Submit a form if all of the fields were filled by clicking “Submit” button. Submission should validate fields and if any of values are missing, appropriate validation message should appear under respective field. After validation is made form values should be sent to an API using POST method. URL: https://fe-hometask-api.qa.vault.tryvault.com/profile-details . Example of request:

  ```
  {
      "firstName": "Hello",
      "lastName": "World",
      "corporationNumber": "826417395",
      "phone": "+13062776103"
  }
  ```

  For successful form submission there will be just 200 status in response. For failed submission there will be a 400 status code and a message if any field is missing or if any field didn’t pass a validation on back-end. For example:

  ```
  {
      "message": "Invalid phone number"
  }
  ```

### Design

- visit design.png
