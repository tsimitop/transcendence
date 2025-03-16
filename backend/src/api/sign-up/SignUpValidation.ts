class SignUpValidation {
  constructor(
    private _email: string,
    private _username: string,
    private _password: string
  ) {}

  static errorMessage = "invalid input(s)";

  static passwordError =
    "Password must be between 8 and 30 characters, and include at least 1 lowercase and one uppercase letters, and 1 special character @$!%*?&";
  static emailError = "Email address is not valid";

  isPasswordValid() {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    return passwordRegex.test(this._password);
  }

  isEmailValid() {
    const emailRegex =
      /^(?!\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
    return emailRegex.test(this._email);
  }

  isFormValid() {
    const validEmail = this.isEmailValid();
    const validPassword = this.isPasswordValid();

    return { validEmail, validPassword };
  }
}

export default SignUpValidation;
