export enum ResponseMessage {
  // General
  INTERNAL_SERVER_ERROR = 'Internal Server Error.',
  UNAUTHORIZED = 'Un-authorized.',
  NOT_FOUNDED = 'Not founded.',

  //SMS
  DAY_LIMIT_EXCEEDED = 'The number of authentications allowed per day has been exceeded.',
  SMS_SENT_SUCCESSFULLY = `Verification SMS is sent successfully.`,
  SMS_SEND_ERROR_NCP = 'SMS send error occurred.',

  // AUTH
  NOT_VALID_VERIFICATION_CODE = 'Not valid verification code.',
  VERIFICATION_CODE_EXPIRED = 'Verfication code expired.',
  NOT_CORRECT_ID_OR_PW = 'Wrong ID or Passcode',
  TOKEN_EXPIRED = 'Token is expired.',
  ALREADY_EXIST_ID = 'Already Exist ID',
  NOT_EXIST_USER = 'Not exist user',

  // Routain
  ALREADY_EXIST_ROUTAIN = 'Already exist routain.',
  UNREGISTERED_ROUTAIN = 'Unregistered routain',
  ROUTAIN_NOT_FOUNDED = 'Routain not founded.',
  ALREADY_STARTED_ROUTAIN = 'Already started routain',
  ALREADY_STOPPED_ROUTAIN = 'Already sopped routain',

  // Atom
  ALREADY_EXIST_ATOM = 'Already exist atom.',
  UNREGISTERED_ATOM = 'Unregistered atom',
  ATOM_NOT_FOUNDED = 'Atom not founded.',
  ATOM_IS_USING = 'Atom is using.'
}
