import { Component, ElementRef, OnDestroy, OnInit, HostListener } from '@angular/core';
import { endOfMonth, startOfMonth } from "date-fns";
import { Plate } from "../../model/plate.model";
import { BoardService } from "../board/board.service";
import { SampleService } from "../sample/sample.service";
import { Sample } from "../../model/sample.model";
import { Well } from "../../model/well.model";
import { PLATE_96_H } from "../../config/constants.plate";
import { faEyedropper } from "@fortawesome/free-solid-svg-icons";
import { NzContextMenuService, NzDropdownMenuComponent } from "ng-zorro-antd/dropdown";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      this.ctrlKeyPressed = true;
    }

    if (event.shiftKey) {
      this.shiftKeyPressed = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Control') {
      this.ctrlKeyPressed = false;
    }

    if (event.key === 'Shift') {
      this.shiftKeyPressed = false;
    }
  }

  ctrlKeyPressed: boolean = false;
  shiftKeyPressed: boolean = false;

  showVideoModal: boolean = false;

  plates?: Plate[];
  selectedPlate?: Plate;
  selectedPlateStatus?: string;
  plateDateRanges = { '今日': [new Date(), new Date()], '本月': [startOfMonth(new Date()), endOfMonth(new Date())] };
  selectedPlateDates?: Date[];
  showPlateInfoModal: boolean = false;

  sampleType?: string;
  samples: Sample[] = [];
  sampleDateRanges = { '今日': [new Date(), new Date()], '本月': [startOfMonth(new Date()), endOfMonth(new Date())] };
  targetSampleDates?: Date[];

  importing = false;
  checked = false;
  indeterminate = false;
  listOfCurrentPageSample: readonly Sample[] = [];
  setOfCheckedId = new Set<number>();
  selectedSamples: Sample[] = [];
  listOfSelectedSample = [
    {
      text: 'Select All Row',
      onSelect: () => {
        this.onAllSampleChecked(true);
      }
    },
    {
      text: 'Select Odd Row',
      onSelect: () => {
        this.listOfCurrentPageSample.forEach((data, index) => this.updateCheckedSet(data.id, index % 2 !== 0));
        this.refreshCheckedStatus();
      }
    },
    {
      text: 'Select Even Row',
      onSelect: () => {
        this.listOfCurrentPageSample.forEach((data, index) => this.updateCheckedSet(data.id, index % 2 === 0));
        this.refreshCheckedStatus();
      }
    }
  ];

  plateDirection = 'horizontal';
  // circlesArray = Array.from({ length: 96 }, (_, i) => i);
  plate96x = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  plate96y = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  showSampleInfoModal: boolean = false;
  selectedSample4Info?: Sample;

  isRightSidePanelOpen = false;
  iconStyleClass = '';
  wellArray: Well[] = Array(96);
  selectedWell?: Well;

  protected readonly faEyedropper = faEyedropper;

  constructor(
    protected boardService: BoardService,
    protected sampleService: SampleService,
    protected elementRef: ElementRef,
    private nzContextMenuService: NzContextMenuService,
  ) {

    // 获取board数据
    this.boardService.getPlateData().subscribe(data => {
      this.plates = data;
      if (this.plates !== undefined) {
        this.selectedPlate = this.plates[0]
      }
    });

    // 获取sample数据
    this.sampleService.getSampleData().subscribe(data => {
      this.samples = data;
      let idx = 0;
      for (let s of this.samples) {
        s.id = idx;
        idx++;
      }
    });

    // 初始化筛选项
    this.selectedPlateStatus = '空板';
    this.selectedPlateDates = [startOfMonth(new Date()), endOfMonth(new Date())];

    this.sampleType = '菌';
    this.targetSampleDates = [startOfMonth(new Date()), endOfMonth(new Date())];

  }

  ngOnInit() {
    // 注册全局点击事件
    document.addEventListener('click', this.handleGlobalClick.bind(this), true);

    // 初始化96孔板
    this.initPlate96();
  }

  ngOnDestroy() {
    // 组件销毁时移除事件监听
    document.removeEventListener('click', this.handleGlobalClick, true);
  }

  private initPlate96() {
    // 初始化96孔板
    this.wellArray = [];
    for (let seat = 0; seat < 96; seat++) {
      const w = new Well();
      w.seat = seat;
      let [x, y] = this.calcCoordinate96Horizontal(seat);
      if (x != null && y != null) {
        w.coordinate = PLATE_96_H[x][y];
      }
      this.wellArray.push(w);
    }
  }

  // 如果在右侧面板之外任意地方单击，则收起面板(如果面板是展开状态)
  private handleGlobalClick(event: MouseEvent) {
    // 检查点击事件是否发生在弹框外
    const clickTarget = event.target as HTMLElement;
    const boardList = this.elementRef.nativeElement.querySelector('#board-list');
    const sampleList = this.elementRef.nativeElement.querySelector('#sample-list');
    if ((boardList && boardList.contains(clickTarget)) || (sampleList && sampleList.contains(clickTarget))) {
      // 如果点击事件在弹框外发生，执行收起弹框的逻辑
      if (this.isRightSidePanelOpen) {
        this.isRightSidePanelOpen = false;
        this.iconStyleClass = 'arrowTurnLeft';
      }
    }
  }

  onBoardDatesChange(result: Date[]): void {
    console.log('From: ', result[0], ', to: ', result[1]);
  }

  onSampleDatesChange(result: Date[]): void {
    console.log('From: ', result[0], ', to: ', result[1]);
  }

  onPlateChange() {
  }

  closePlateInfoDlg() {
    this.showPlateInfoModal = false;
  }

  downloadTemplate() {
    this.sampleService.downloadTemplate().subscribe(res => {
      const blob = new Blob([res], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  batchImport(event: any) {
    if (this.importing) {
      // 如果是正在上传，则不做响应
      return;
    }

    if (event.target.files.length === 0) {
      // 如果是点击“取消”按钮，则直接返回
      return;
    }

    this.importing = true;

    /* wire up file reader */
    const target: DataTransfer = event.target as DataTransfer;
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      window.console.log('==========5693', rawData);
    };
    reader.readAsBinaryString(target.files[0]);

    this.importing = false;
  }

  searchSample() {

  }

  showSampleInfoDlg(s: Sample | undefined) {
    if (s === undefined) {
      return;
    }
    this.selectedSample4Info = s;
    this.showSampleInfoModal = true;
  }

  closeSampleInfoDlg() {
    this.showSampleInfoModal = false;
  }

  onAllSampleChecked(value: boolean): void {
    this.listOfCurrentPageSample.forEach(item => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  onSampleChecked(id?: number, checked?: boolean): void {
    if (id === undefined) {
      return;
    }
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  updateCheckedSet(id?: number, checked?: boolean): void {
    if (id === undefined) {
      return;
    }
    if (checked) {
      let s = this.samples.find(s => s.id === id);
      if (s === undefined) {
        return;
      }
      if (s.board_location !== undefined && s.board_location !== null && s.board_location !== '') {
        return;
      }
      this.setOfCheckedId.add(id);
      this.selectedSamples.push(s);
    } else {
      this.setOfCheckedId.delete(id);
      this.selectedSamples = this.selectedSamples.filter(s => s.id !== id);
    }
  }

  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageSample.every(item => item.id !== undefined && this.setOfCheckedId.has(item.id));
    this.indeterminate = this.listOfCurrentPageSample.some(item => item.id !== undefined && this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  onCurrentPageDataChange($event: readonly Sample[]): void {
    this.listOfCurrentPageSample = $event;
    this.refreshCheckedStatus();
  }

  calcCenter96ByIdx(idx: number) {

    if (idx < 0 || idx > 95) {
      return [null, null];
    }

    let row = Math.floor(idx / 12);
    let col = idx % 12;

    let x = col * 28 + 40;
    let y = row * 28 + 40;

    return [x, y];

  }

  // A1->A12,B1->B12,......H1->H12
  private calcCoordinate96Horizontal(idx: number) {
    if (idx < 0 || idx > 95) {
      return [null, null];
    }

    let row = Math.floor(idx / 12);
    let col = idx % 12;

    return [row, col];
  }


  // A1->H1,A2->H2,......A12->H12
  private calcCoordinate96Vertical(idx: number) {

  }

  toggleRightPanel() {
    this.isRightSidePanelOpen = !this.isRightSidePanelOpen;
    this.iconStyleClass = (this.isRightSidePanelOpen ? 'arrowTurnRight' : 'arrowTurnLeft');
  }

  toggleWellSelection(w: Well) {
    if (w == null) {
      return;
    }

    w.selected = !w.selected;

    if (!this.ctrlKeyPressed) {
      for (let otherWell of this.wellArray) {
        if (otherWell.seat !== w.seat) {
          otherWell.selected = false;
        }
      }
    }

    if (w.selected) {
      if (this.shiftKeyPressed) {
        for (let sameRowWell of this.wellArray) {
          if (sameRowWell.coordinate[0] === w.coordinate[0]) {
            sameRowWell.selected = true;
          }
        }
      } else {
        this.selectedWell = w;
      }
    } else {
      if (this.shiftKeyPressed) {
        for (let sameRowWell of this.wellArray) {
          if (sameRowWell.coordinate[0] === w.coordinate[0]) {
            sameRowWell.selected = false;
          }
        }
      }
      this.selectedWell = undefined;
    }
  }

  add2Plate() {
    if (this.selectedSamples.length === 0) {
      alert('请选择要排版的样品');
      return;
    }

    if (this.selectedWell === undefined) {
      alert('请选择起始孔位置');
      return;
    }

    let startSeat = this.selectedWell.seat;
    // 判断样品数量是否足够在目前的板上排入
    if (this.selectedSamples.length > (96- startSeat)) {
      alert("板上从起始位置开始不够排下当前选择的样品数量，请重新选择");
      return;
    }

    for (let i = 0; i < this.selectedSamples.length; i++) {
      this.fillInWell(startSeat + i, this.selectedSamples[i]);
    }

    this.onAllSampleChecked(false);
  }

  private fillInWell(seat: number, sample: Sample) {
    this.wellArray[seat].occupied = true;
    this.wellArray[seat].sample = sample;
    sample.board_location = this.wellArray[seat].coordinate;
  }

  clearWell() {
    for (let w of this.wellArray) {
      if (w.selected) {
        w.selected = false;
        w.occupied = false;
        if (w.sample) {
          w.sample.board_location = '';
          w.sample = undefined;
        }
      }
    }
  }

  clearPlate() {
    for (let w of this.wellArray) {
      if (w.occupied) {
        w.occupied = false;
        if (w.sample) {
          w.sample.board_location = '';
          w.sample = undefined;
        }
      }
    }
  }

  // 板列表的右键菜单
  plateContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.nzContextMenuService.create($event, menu);
  }

  // 96孔板中样品的右键菜单
  sampleContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.nzContextMenuService.create($event, menu);
  }

  selectAllWell(event: MouseEvent, menuItem: string): void {
    // 处理菜单项点击事件
    for (let w of this.wellArray) {
      w.selected = true;
    }

    this.closeMenu();
  }

  clearAllWellSelection(event: MouseEvent, menuItem: string): void {
    // 阻止默认的右键点击事件
    // event.preventDefault();

    // 处理菜单项点击事件
    for (let w of this.wellArray) {
      w.selected = false;
    }

    this.closeMenu();
  }

  showPlateInfoDlg(event: MouseEvent, plateSerial: string | undefined) {
    if (this.plates !== undefined && plateSerial !== undefined) {
      this.selectedPlate = this.plates.find(p => p.serial === plateSerial);
      if (this.selectedPlate !== undefined) {
        this.showPlateInfoModal = true;
      }
    }

    this.closeMenu();

  }

  closeMenu(): void {
    this.nzContextMenuService.close();
  }

  showVideoDlg() {
    this.showVideoModal = true;
  }

  closeVideoDlg() {
    this.showVideoModal = false;
  }

  playVideo(video: HTMLVideoElement) {
    video.play();
  }

  pauseVideo(video: HTMLVideoElement) {
    video.pause();
  }
}
