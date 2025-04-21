class FormValidation {
  constructor(
    private _email: string,
    private _username: string,
    private _password: string
  ) {}

  static errorMessage = "Invalid input(s)";

  static passwordError =
    "Password must be between 8 and 30 characters, and include at least 1 lowercase and one uppercase letters, and 1 special character @$!%*?&";
  static usernameError =
    "Username must be between 4 and 20 characters, including only letters and numbers, and at least one letter";
  static emailError = "Email address is not valid";

  isEmailValid() {
    const emailRegex =
      /^(?!\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
    return emailRegex.test(this._email);
  }

  isUsernameValid() {
    const usernameRegex = /^(?=(.*[a-zA-Z]))[a-zA-Z0-9]{4,20}$/;
    return usernameRegex.test(this._username);
  }

  isPasswordValid() {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    return passwordRegex.test(this._password);
  }

  isFormValid() {
    const validEmail = this.isEmailValid();
    const validUsername = this.isUsernameValid();
    const validPassword = this.isPasswordValid();
    return { validEmail, validUsername, validPassword };
  }
}

export default FormValidation;
