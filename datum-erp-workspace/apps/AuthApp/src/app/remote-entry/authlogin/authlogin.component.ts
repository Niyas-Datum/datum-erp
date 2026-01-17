import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../../services/login.service';
import { APPLICATION_CONSTANT, EndpointConstant } from '@org/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiResponseDto, BranchDto, CompanyDto } from '@org/models';
import { observable } from 'rxjs';
import { Router } from '@angular/router';
import { CurrentUserDto } from '../../../model/currentUserDto.model';
import { UserSettingDto,ShortcutMenuDto } from '@org/models';
import { BaseService, DataSharingService } from '@org/services';

//import { MatDialog } from '@angular/material/dialog';
//import { DialogTemplateComponent, ModalType } from '@datum/services';

@Component({
  selector: 'app-authlogin.component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './authlogin.component.html',
  styleUrl: './authlogin.component.css',
})
export class AuthloginComponent implements OnInit {
  private loginService = inject(LoginService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  private dataSharingService = inject(DataSharingService);

  applicationConstants = APPLICATION_CONSTANT;

  companyList = signal<CompanyDto[]>([]);
  branchList = signal<BranchDto[]>([]);

  selectedCompany = signal<CompanyDto | null>(null);
  selectedBranch = signal<BranchDto | null>(null);


  baseService = inject(BaseService);

  ngOnInit(): void {
    this.getCompanyList();
    this.processJwtToken();
  }

  private formBuilder = inject(FormBuilder);

  loginForm = this.formBuilder.group({
    company: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    branch: [{ value: '', disabled: true }, Validators.required],
  });

  getCompanyList() {
    this.loginService
      .fetch<CompanyDto[]>(EndpointConstant.COMPANIES)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.isValid && res.httpCode !== 200) {
            console.log('Company List:', res.data);
          } else {
            this.companyList.set(res.data);
          }
        },
        error: (err) => console.error('Error fetching companies', err),
      });
  }

  onCompanySelect(): void {
    console.log('Company selected:', this.loginForm.get('company')?.value);
    const selectedCompanyId = Number(this.loginForm.get('company')?.value);
    const company = this.companyList().find((c) => c.id == selectedCompanyId);
    this.selectedCompany.set(company ?? null);

    if (company) {
      this.loginForm.get('branch')?.enable();
      this.loginService.getUUID();
      this.setDBConnection(company.id);
    }
  }

  setDBConnection(companyId: number) {
    this.loginService
      .setDBConnection(`${EndpointConstant.SETCONNECTION}${companyId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.getBranchList(),
        error: (err) => console.error('Error setting DB connection', err),
      });
  }

  getBranchList(): void {
    this.loginService
      .fetch<BranchDto[]>(EndpointConstant.BRANCHES)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('Branch List:', res.data);
          this.branchList.set(res?.data || []);
          const defaultBranch = this.branchList()[0];
          this.loginService.setLocalStorageItem('branchList', JSON.stringify(this.branchList()));
          if (defaultBranch) {
            this.loginForm.patchValue({ branch: defaultBranch.id.toString() });
            this.selectedBranch.set(defaultBranch);
          }
        },
        error: (err) => console.error('Error fetching branches', err),
      });
  }

  onBranchSelect(): void {
    const selectedBranchId = Number(this.loginForm.get('branch')?.value);
    const branch = this.branchList().find((b) => b.id == selectedBranchId);
    this.selectedBranch.set(branch ?? null);
  }


  onSubmit(): void {
    if (this.loginForm.invalid) return;
    //this.isLoading.set(true);
    const submissionData = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
      company: {
        id: this.selectedCompany()?.id,
        value: this.selectedCompany()?.name,
      },
      branch: {
        id: this.selectedBranch()?.id,
        value: this.selectedBranch()?.name,
      },
    };
    this.loginService
      .login<CurrentUserDto> (EndpointConstant.LOGIN, submissionData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (res) => {
         // this.isLoading.set(false);

          const token = res.token;
console.log( res.token);
          if (!token) {
            this.loginService.setLocalStorageItem('access_token', '');
            this.loginService.setLocalStorageItem('username', '');
            this.loginService.setLocalStorageItem('current_branch', '');
            this.loginService.setLocalStorageItem('settings', '');
            return;
          }
          this.loginService.setLocalStorageItem('current_user', res?.users.employeeID)
          this.loginService.setLocalStorageItem('username', this.loginForm.value.username!);
          this.loginService.setLocalStorageItem('access_token', token);
          this.loginService.setLocalStorageItem('current_branch',res?.users.branchId);
          this.loginService.setLocalStorageItem('settings', res?.settings);
          this.loginService.setLocalStorageItem('companyName', res?.users.hoCompanyName);
          this.loginService.setLocalStorageItem('branchName', res?.users.company);
          //console.log('Login successful:', res);
          this.setNumericFormat(JSON.parse(res.settings));
          

          const menuItems = res?.userPageListView;
          if (menuItems) {
           // this.store.dispatch(loadMenuSuccess({ menuItems }));
            this.loginService.setLocalStorageItem('menuData', JSON.stringify(menuItems));
           }
          await this.fetchShortcutMenu();

          this.dataSharingService.sharedData = JSON.stringify(menuItems);
          this.router.navigate(
            [this.applicationConstants?.appRouting?.MAIN_APP],
           // { queryParams: { menu: JSON.stringify(menuItems), name: 'Niyas' } }
          );
        
        },
        // error: (err) => {
        //   this.baseService.showCustomDialogue(err?.error);
        //   //alert(err?.error)          
        // },

        error: (err) => {
          this.baseService.showCustomDialoguePopup(err?.error, 'Login Failed', "WARN");
        },




      });
  }
setNumericFormat(settings: UserSettingDto[]): void {

  console.log('User Settings:', settings);
  const numericFormatSetting = settings.find(s => s.Key === "NumericFormat");
  if (numericFormatSetting) {
    console.log('Numeric Format:', numericFormatSetting.Value);
    this.loginService.setLocalStorageItem('numericFormat', numericFormatSetting.Value);
  }
}


async fetchShortcutMenu(): Promise<void> {
  await this.loginService
    .fetch<ShortcutMenuDto[]>(EndpointConstant.FILLSHORTCUTMENU)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => {
        
        console.log('Shortcut Menu:', res.data);
        //this.shortcutMenu.set(res?.data || []);
      },
      error: (err) => console.error('Error fetching shortcut menu', err),
    });
}

  // ========== JWT Token Processing Methods ==========

  /**
   * Process JWT token and extract user information
   */
  private processJwtToken(): void {
    // The JWT token you provided
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI2OCIsImJyYW5jaCI6IkRpYmFqIFdvcmxkIFRyYWRpbmcgRXN0LiIsImJyYW5jaElkIjoiMSIsInVuaXF1ZV9uYW1lIjoiTU9IQU1NRUQgSEFSSVMgIEhBUklTIiwiZmlueWVhclN0YXJ0IjoiMy8xLzIwMjIgMTI6MDA6MDAgQU0iLCJmaW55ZWFyRW5kIjoiMTIvMzEvMjAyMiAxMjowMDowMCBBTSIsInZhdE5vIjoiMzE0MTczMDI4MjAwMDAzIiwibnVtZXJpY0Zvcm1hdCI6Ik40Iiwicm9sZSI6IkJpbGxpbmciLCJkZXBhcnRtZW50IjoiRmluYW5jZSBEZXBhcnRtZW50IiwiaG9Db21wYW55IjoiRGliYWogV29ybGQgVHJhZGluZyBFc3QuIiwibmJmIjoxNzYxMzc3Mzk4LCJleHAiOjE3NjE5ODIxOTgsImlhdCI6MTc2MTM3NzM5OH0.EZ-gtKKKyT9iqPgjEQkJ2E_wRjqrInn62DzvqL46pkk';
    
    this.processToken(jwtToken);
  }

  /**
   * Process any JWT token and extract user information
   * @param token - The JWT token to process
   */
  processToken(token: string): void {
    // Extract and save user information
    const userId = this.extractAndSaveUserId(token);
    
    if (userId) {
      console.log('✅ JWT Token processed successfully');
      console.log('✅ User ID extracted and saved:', userId);
      
      // Get all user information
      const userInfo = this.getUserInfo();
      console.log('✅ Complete user information:', userInfo);
      
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        console.warn('⚠️ JWT Token is expired');
      } else {
        console.log('✅ JWT Token is valid');
      }
    } else {
      console.error('❌ Failed to process JWT token');
    }
  }

  /**
   * Decodes a JWT token and returns the payload
   * @param token - The JWT token to decode
   * @returns The decoded payload or null if invalid
   */
  private decodeToken(token: string): any {
    try {
      // Split the token into its three parts
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      // Decode the payload (second part)
      const payload = parts[1];
      
      // Add padding if needed
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      // Decode base64
      const decodedPayload = atob(paddedPayload);
      
      // Parse JSON
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Extracts user ID from JWT token and saves it to localStorage
   * @param token - The JWT token
   * @returns The user ID or null if extraction fails
   */
  private extractAndSaveUserId(token: string): string | null {
    const payload = this.decodeToken(token);
    
    if (payload && payload.id) {
      const userId = payload.id.toString();
      
      // Save to localStorage using the existing loginService method
      this.loginService.setLocalStorageItem('userId', userId);
      this.loginService.setLocalStorageItem('userToken', token);
      
      // Also save other useful user information
      if (payload.unique_name) {
        this.loginService.setLocalStorageItem('userName', payload.unique_name);
      }
      if (payload.branch) {
        this.loginService.setLocalStorageItem('userBranch', payload.branch);
      }
      if (payload.role) {
        this.loginService.setLocalStorageItem('userRole', payload.role);
      }
      if (payload.branchId) {
        this.loginService.setLocalStorageItem('branchId', payload.branchId.toString());
      }
      if (payload.vatNo) {
        this.loginService.setLocalStorageItem('vatNo', payload.vatNo);
      }
      if (payload.numericFormat) {
        this.loginService.setLocalStorageItem('numericFormat', payload.numericFormat);
      }
      if (payload.department) {
        this.loginService.setLocalStorageItem('department', payload.department);
      }
      if (payload.hoCompany) {
        this.loginService.setLocalStorageItem('hoCompany', payload.hoCompany);
      }
      
      console.log('✅ User ID saved to localStorage:', userId);
      console.log('✅ Additional user info saved:', {
        userName: payload.unique_name,
        branch: payload.branch,
        role: payload.role,
        branchId: payload.branchId,
        vatNo: payload.vatNo,
        numericFormat: payload.numericFormat,
        department: payload.department,
        hoCompany: payload.hoCompany
      });
      
      return userId;
    }
    
    console.error('❌ Failed to extract user ID from token');
    return null;
  }

  /**
   * Gets the user ID from localStorage
   * @returns The user ID or null if not found
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Gets the user token from localStorage
   * @returns The user token or null if not found
   */
  getUserToken(): string | null {
    return localStorage.getItem('userToken');
  }

  /**
   * Gets all user information from localStorage
   * @returns Object containing user information
   */
  getUserInfo(): any {
    return {
      userId: localStorage.getItem('userId'),
      userName: localStorage.getItem('userName'),
      userBranch: localStorage.getItem('userBranch'),
      userRole: localStorage.getItem('userRole'),
      branchId: localStorage.getItem('branchId'),
      userToken: localStorage.getItem('userToken'),
      vatNo: localStorage.getItem('vatNo'),
      numericFormat: localStorage.getItem('numericFormat'),
      department: localStorage.getItem('department'),
      hoCompany: localStorage.getItem('hoCompany')
    };
  }

  /**
   * Clears all user information from localStorage
   */
  clearUserInfo(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userBranch');
    localStorage.removeItem('userRole');
    localStorage.removeItem('branchId');
    localStorage.removeItem('userToken');
    localStorage.removeItem('vatNo');
    localStorage.removeItem('numericFormat');
    localStorage.removeItem('department');
    localStorage.removeItem('hoCompany');
    console.log('✅ User information cleared from localStorage');
  }

  /**
   * Checks if the token is expired
   * @param token - The JWT token to check
   * @returns True if expired, false otherwise
   */
  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    
    if (!payload || !payload.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }
}
