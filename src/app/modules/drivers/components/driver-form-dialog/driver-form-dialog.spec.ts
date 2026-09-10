import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { DriverService } from '../../services/driver.service';
import { Driver } from '../../types/driver.types';
import { DriverFormDialog } from './driver-form-dialog';

const savedDriver: Driver = {
  id: 'driver-1',
  driverId: 'DRV-00001',
  firstName: 'Mary',
  lastName: 'Mangune',
  licenseNumber: 'N03-12-345678',
  photoUrl: null,
  isArchived: false,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
};

describe('DriverFormDialog', () => {
  let component: DriverFormDialog;
  let fixture: ComponentFixture<DriverFormDialog>;
  let createDriver: ReturnType<typeof vi.fn>;
  let updateDriver: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createDriver = vi.fn(() => of(savedDriver));
    updateDriver = vi.fn(() => of(savedDriver));

    await TestBed.configureTestingModule({
      imports: [DriverFormDialog],
      providers: [
        {
          provide: DriverService,
          useValue: {
            create: createDriver,
            update: updateDriver,
          },
        },
        {
          provide: NotificationService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
            fromHttpError: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverFormDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    component.form.setValue({
      driverId: 'DRV-00001',
      firstName: ' Mary ',
      lastName: ' Mangune ',
      licenseNumber: ' N03-12-345678 ',
    });
  });

  it('requires the locked server driver id on registration', () => {
    const input = fixture.nativeElement.querySelector('#driver-id') as HTMLInputElement | null;

    expect(input).not.toBeNull();
    expect(input?.required).toBe(true);
    expect(input?.maxLength).toBe(9);

    component.form.controls.driverId.setValue('8bea9b1f-5ae7-465d-a646-4f66a2a5f501');
    expect(component.form.controls.driverId.invalid).toBe(true);

    component.form.controls.driverId.setValue('DRB-2026-001');
    expect(component.form.controls.driverId.invalid).toBe(true);

    component.form.controls.driverId.setValue('DRV-00001');
    expect(component.form.controls.driverId.valid).toBe(true);
  });

  it('requires all four face photos when creating a driver', () => {
    component.submit();

    expect(createDriver).not.toHaveBeenCalled();
    expect(component.facePhotosTouched()).toBe(true);
    expect(component.missingFacePhotoCount()).toBe(4);
  });

  it('renders one required image input for every face-recognition pose', () => {
    const inputs = document.body.querySelectorAll<HTMLInputElement>(
      'input[type="file"][accept="image/*"]',
    );

    expect(inputs).toHaveLength(4);
    expect([...inputs].every(input => input.required)).toBe(true);
    expect([...inputs].map(input => input.id)).toEqual([
      'driver-face-front',
      'driver-face-down',
      'driver-face-left',
      'driver-face-right',
    ]);
  });

  it('keeps the demo face photos out of the existing driver API call', () => {
    const photo = new File(['face'], 'face.jpg', { type: 'image/jpeg' });
    component.facePhotoFiles.set({
      FRONT: photo,
      DOWN: photo,
      LEFT: photo,
      RIGHT: photo,
    });

    component.submit();

    expect(createDriver).toHaveBeenCalledWith({
      driverId: 'DRV-00001',
      firstName: 'Mary',
      lastName: 'Mangune',
      licenseNumber: 'N03-12-345678',
    });
  });

  it('requires the four face photos while editing a driver', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('driver', savedDriver);
    fixture.detectChanges();

    component.submit();

    expect(updateDriver).not.toHaveBeenCalled();
    expect(component.facePhotosTouched()).toBe(true);

    const photo = new File(['face'], 'face.jpg', { type: 'image/jpeg' });
    component.facePhotoFiles.set({
      FRONT: photo,
      DOWN: photo,
      LEFT: photo,
      RIGHT: photo,
    });
    component.submit();

    expect(updateDriver).toHaveBeenCalledWith(savedDriver.id, {
      firstName: savedDriver.firstName,
      lastName: savedDriver.lastName,
      licenseNumber: savedDriver.licenseNumber,
    });
  });
});
