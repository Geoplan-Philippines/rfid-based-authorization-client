import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollArea } from './scroll-area';

describe('ScrollArea', () => {
  let component: ScrollArea;
  let fixture: ComponentFixture<ScrollArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollArea],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollArea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the scroll area component', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to vertical orientation', () => {
    expect(component.orientation).toBe('vertical');
  });

  it('updates scrollbar state correctly', () => {
    component.updateScrollbar();
    expect(component['viewportRef']).toBeDefined();
  });
});
