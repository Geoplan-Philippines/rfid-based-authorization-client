import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

@Component({
  selector: 'app-scroll-area',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #viewport
      class="h-full w-full rounded-[inherit] overflow-auto scrollbar-none"
      [class]="viewportClasses()"
      (scroll)="onScroll()"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <div #content class="min-w-full inline-block align-top">
        <ng-content></ng-content>
      </div>
    </div>

    <!-- Vertical Scrollbar -->
    @if ((orientation === 'vertical' || orientation === 'both') && hasVerticalScroll()) {
      <div
        class="absolute top-0 right-0 bottom-0 w-2.5 z-10 select-none touch-none p-0.5 transition-opacity duration-200 ease-out"
        [ngClass]="[
          scrollbarTrackClass,
          isScrolling() || isHovered() || isDragging ? 'opacity-100' : 'opacity-0'
        ]"
        (mouseenter)="onMouseEnter()"
        (mouseleave)="onMouseLeave()"
      >
        <div
          class="relative w-full rounded-full bg-border hover:bg-body/40 transition-colors cursor-pointer"
          [ngClass]="scrollbarThumbClass"
          [style.height.%]="thumbHeightPercent()"
          [style.transform]="'translateY(' + thumbTopPx() + 'px)'"
          (mousedown)="onThumbMouseDown($event, 'vertical')"
        ></div>
      </div>
    }

    <!-- Horizontal Scrollbar -->
    @if ((orientation === 'horizontal' || orientation === 'both') && hasHorizontalScroll()) {
      <div
        class="absolute bottom-0 left-0 right-0 h-2.5 z-10 select-none touch-none p-0.5 transition-opacity duration-200 ease-out"
        [ngClass]="[
          scrollbarTrackClass,
          isScrolling() || isHovered() || isDragging ? 'opacity-100' : 'opacity-0'
        ]"
        (mouseenter)="onMouseEnter()"
        (mouseleave)="onMouseLeave()"
      >
        <div
          class="relative h-full rounded-full bg-border hover:bg-body/40 transition-colors cursor-pointer"
          [ngClass]="scrollbarThumbClass"
          [style.width.%]="thumbWidthPercent()"
          [style.transform]="'translateX(' + thumbLeftPx() + 'px)'"
          (mousedown)="onThumbMouseDown($event, 'horizontal')"
        ></div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
    }
    
    /* Hide native scrollbars while preserving native scrolling performance */
    .scrollbar-none {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .scrollbar-none::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
  `]
})
export class ScrollArea implements OnInit, AfterViewInit, OnDestroy {
  @Input() orientation: ScrollAreaOrientation = 'vertical';
  @Input() viewportClass: string = '';
  @Input() scrollbarTrackClass: string = '';
  @Input() scrollbarThumbClass: string = '';

  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('content', { static: true }) contentRef!: ElementRef<HTMLDivElement>;

  protected readonly isHovered = signal(false);
  protected readonly isScrolling = signal(false);
  
  protected readonly hasVerticalScroll = signal(false);
  protected readonly thumbHeightPercent = signal(100);
  protected readonly thumbTopPx = signal(0);
  
  protected readonly hasHorizontalScroll = signal(false);
  protected readonly thumbWidthPercent = signal(100);
  protected readonly thumbLeftPx = signal(0);

  protected isDragging = false;
  private dragStartPos = 0;
  private dragStartScrollPos = 0;
  private dragOrientation: 'vertical' | 'horizontal' = 'vertical';

  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver?: ResizeObserver;

  protected viewportClasses(): string {
    const overflow =
      this.orientation === 'vertical'
        ? 'overflow-y-auto overflow-x-hidden'
        : this.orientation === 'horizontal'
        ? 'overflow-x-auto overflow-y-hidden'
        : 'overflow-auto';
    return `h-full w-full rounded-[inherit] ${overflow} scrollbar-none ${this.viewportClass}`.trim();
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollbar();
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.viewportRef?.nativeElement) {
      this.resizeObserver?.observe(this.viewportRef.nativeElement);
    }
    if (this.contentRef?.nativeElement) {
      this.resizeObserver?.observe(this.contentRef.nativeElement);
    }
    setTimeout(() => this.updateScrollbar(), 0);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.removeDragListeners();
  }

  protected onMouseEnter(): void {
    this.isHovered.set(true);
    this.updateScrollbar();
  }

  protected onMouseLeave(): void {
    if (!this.isDragging) {
      this.isHovered.set(false);
    }
  }

  protected onScroll(): void {
    this.updateScrollbar();
    this.isScrolling.set(true);

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling.set(false);
    }, 1200);
  }

  public updateScrollbar(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = viewport;

    // Vertical scrollbar calculation
    if (scrollHeight > clientHeight) {
      this.hasVerticalScroll.set(true);
      const heightRatio = clientHeight / scrollHeight;
      const thumbHeight = Math.max(heightRatio * clientHeight, 24); // minimum 24px thumb
      const scrollableHeight = scrollHeight - clientHeight;
      const maxThumbTop = clientHeight - thumbHeight;
      const thumbTop = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * maxThumbTop : 0;

      this.thumbHeightPercent.set((thumbHeight / clientHeight) * 100);
      this.thumbTopPx.set(thumbTop);
    } else {
      this.hasVerticalScroll.set(false);
      this.thumbHeightPercent.set(0);
      this.thumbTopPx.set(0);
    }

    // Horizontal scrollbar calculation
    if (scrollWidth > clientWidth) {
      this.hasHorizontalScroll.set(true);
      const widthRatio = clientWidth / scrollWidth;
      const thumbWidth = Math.max(widthRatio * clientWidth, 24);
      const scrollableWidth = scrollWidth - clientWidth;
      const maxThumbLeft = clientWidth - thumbWidth;
      const thumbLeft = scrollableWidth > 0 ? (scrollLeft / scrollableWidth) * maxThumbLeft : 0;

      this.thumbWidthPercent.set((thumbWidth / clientWidth) * 100);
      this.thumbLeftPx.set(thumbLeft);
    } else {
      this.hasHorizontalScroll.set(false);
      this.thumbWidthPercent.set(0);
      this.thumbLeftPx.set(0);
    }
  }

  protected onThumbMouseDown(event: MouseEvent, orientation: 'vertical' | 'horizontal'): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.dragOrientation = orientation;
    this.dragStartPos = orientation === 'vertical' ? event.clientY : event.clientX;
    
    const viewport = this.viewportRef.nativeElement;
    this.dragStartScrollPos = orientation === 'vertical' ? viewport.scrollTop : viewport.scrollLeft;

    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }

  private onWindowMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    const viewport = this.viewportRef.nativeElement;
    if (this.dragOrientation === 'vertical') {
      const deltaY = event.clientY - this.dragStartPos;
      const { scrollHeight, clientHeight } = viewport;
      const scrollableHeight = scrollHeight - clientHeight;
      const thumbHeight = (this.thumbHeightPercent() / 100) * clientHeight;
      const maxThumbTop = clientHeight - thumbHeight;

      if (maxThumbTop > 0) {
        const scrollDelta = (deltaY / maxThumbTop) * scrollableHeight;
        viewport.scrollTop = this.dragStartScrollPos + scrollDelta;
      }
    } else {
      const deltaX = event.clientX - this.dragStartPos;
      const { scrollWidth, clientWidth } = viewport;
      const scrollableWidth = scrollWidth - clientWidth;
      const thumbWidth = (this.thumbWidthPercent() / 100) * clientWidth;
      const maxThumbLeft = clientWidth - thumbWidth;

      if (maxThumbLeft > 0) {
        const scrollDelta = (deltaX / maxThumbLeft) * scrollableWidth;
        viewport.scrollLeft = this.dragStartScrollPos + scrollDelta;
      }
    }
  };

  private onWindowMouseUp = (): void => {
    this.isDragging = false;
    this.removeDragListeners();
    this.isHovered.set(false);
  };

  private removeDragListeners(): void {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }
}
