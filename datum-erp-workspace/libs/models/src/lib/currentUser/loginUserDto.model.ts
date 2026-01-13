export class LoginUserDto {
  employeeID: number;
  firstName: string;
  loginTime: string;
  loginStatus: number;
  loginSetting: number;
  branchId: number;
  company: string;
  financeYearStartDate: string;  // ISO date format
  financeYearEndDate: string;    // ISO date format
  numericFormat: string;
  userDepartment: string;
  userRole: string;
  vatNo: string;
  mobileNumber?: string;
  arabicName: string;
  accountID: number;
  hoCompanyName: string;
  hoCompanyNameArabic: string;
  expDate?: string | null;

  constructor(data: any) {
    this.employeeID = data.employeeID;
    this.firstName = data.firstName?.trim();
    this.loginTime = data.loginTime;
    this.loginStatus = data.loginStatus;
    this.loginSetting = data.loginSetting;
    this.branchId = data.branchId;
    this.company = data.company;
    this.financeYearStartDate = data.financeYearStartDate;
    this.financeYearEndDate = data.financeYearEndDate;
    this.numericFormat = data.numericFormat;
    this.userDepartment = data.userDepartment;
    this.userRole = data.userRole;
    this.vatNo = data.vatNo;
    this.mobileNumber = data.mobileNumber || '';
    this.arabicName = data.arabicName;
    this.accountID = data.accountID;
    this.hoCompanyName = data.hoCompanyName;
    this.hoCompanyNameArabic = data.hoCompanyNameArabic;
    this.expDate = data.expDate || null;
  }
}
