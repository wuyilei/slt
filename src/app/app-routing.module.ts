import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./lab/home/home.component";
import {AppComponent} from "./app.component";

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'example', component: AppComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
