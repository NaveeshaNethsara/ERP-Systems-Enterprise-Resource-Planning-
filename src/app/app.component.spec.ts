import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render Meridian ERP shell navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navText = compiled.querySelector('.erp-sidebar')?.textContent ?? '';
    expect(navText).toContain('MERIDIAN');
    expect(navText).toContain('Inventory');
    expect(navText).toContain('Employees');
    expect(navText).toContain('Finance');
    expect(navText).toContain('Procurement');
    expect(navText).toContain('Supply Chain');
  });
});
