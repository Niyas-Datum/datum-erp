import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UploaderModule, UploaderComponent } from '@syncfusion/ej2-angular-inputs';
import { HttpClient } from '@angular/common/http';

interface FileSelectedArgs {
  filesData: Array<{
    rawFile: File;
  }>;
}

@Component({
  selector: 'lib-image-uploader',
  templateUrl: './image.html',
  styleUrls: ['./image.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,UploaderModule]
})
export class ImageUploaderComponent {


  @ViewChild('uploader') public uploaderObj!: UploaderComponent;

 

  allowedExtensions = '.png,.jpg,.jpeg';

  // preview as a signal
  private _previewUrl = signal<string | null>(null);
  previewUrl = () => this._previewUrl();

  selectedFile: File | null = null;

  constructor(private http: HttpClient) {}

  // Handler for Syncfusion 'selected' event
  onFileSelected(args: any) {
    if (!args?.filesData || args.filesData.length === 0) return;
    const f = args.filesData[0];
    // different Syncfusion versions use different keys
    const nativeFile: File = f.originalFile || f.rawFile || f.file;
    if (!nativeFile) return;

    if (!nativeFile.type.startsWith('image/')) {
      alert('Please select an image file.');
      setTimeout(() => this.uploaderObj.clearAll(), 0);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (nativeFile.size > maxSize) {
      alert('Image too large. Max 5 MB allowed.');
      setTimeout(() => this.uploaderObj.clearAll(), 0);
      return;
    }

    this.selectedFile = nativeFile;
    const url = URL.createObjectURL(nativeFile);
    this._previewUrl.set(url);
  }

  // Handler for Syncfusion 'removing' event
  onFileRemoving(args: any) {
    this.clearImageState();
  }

  removeImage() {
    if (this.uploaderObj) this.uploaderObj.clearAll();
    this.clearImageState();
  }

  clearImageState() {
    if (this._previewUrl()) {
      try { URL.revokeObjectURL(this._previewUrl()!); } catch {}
    }
    this._previewUrl.set(null);
    this.selectedFile = null;
  }

  // Example upload - adjust URL & headers as required
  uploadImage() {
    if (!this.selectedFile) return;
    const fd = new FormData();
    // fd.append('name', this.form.get('name')!.value || '');
    fd.append('image', this.selectedFile);

    // Example: using HttpClient to POST to server
    this.http.post('/api/items/upload-image', fd).subscribe({
      next: (res) => {
        alert('Image uploaded successfully.');
        // clear or keep preview depending on UX
        this.removeImage();
      },
      error: (err) => {
        console.error('Upload failed', err);
        alert('Upload failed. See console.');
      }
    });
  }

  onSubmit() {
   

    // Option A: Save item first, then upload image in separate request
    // Option B: Include image in same FormData (see uploadImage)
    // Here we call uploadImage if image present; otherwise save only details
   
  }
}


