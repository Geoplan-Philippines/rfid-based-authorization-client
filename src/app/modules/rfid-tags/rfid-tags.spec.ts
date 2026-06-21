import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService, ConfirmationService } from 'primeng/api';

import { RfidTags } from './rfid-tags';

describe('RfidTags', () => {
  let component: RfidTags;
  let fixture: ComponentFixture<RfidTags>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfidTags],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RfidTags);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
