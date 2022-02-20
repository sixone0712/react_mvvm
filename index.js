// const img = document.getElementsByTagName("img");
const img = document.getElementsByClassName("box")[0];

const styleTable = {
  data: {
    width: "px",
    height: "px",
  },
  converter(prop) {
    const conv = Object.entries(prop).map((item) => {
      const [key, value] = item;
      return this.data[key] ? [key, `${value}${this.data[key]}`] : item;
    });

    return Object.fromEntries(conv);
  },
};

const renderTarget = new Set();

const f = (_) => {
  renderTarget.forEach((vm) => vm.render());
  renderTarget.clear();
  requestAnimationFrame(f);
};

requestAnimationFrame(f);

const Handler = class {
  vm;

  constructor(vm) {
    this.vm = vm;
  }

  // 추가, 삭제, 수정 프록시 훅
  defineProperty() {
    console.log("defineProperty");
    renderTarget.add(this.vm);
  }
  deleteProperty() {
    console.log("deleteProperty");
    renderTarget.add(this.vm);
  }
  set(target, property, value) {
    console.log("set", target, property, value);

    target[property] = value;

    renderTarget.add(this.vm);

    renderTarget.forEach((item) => console.log(item));
  }
};

const viewModel = class {
  target;
  //prop: { width: 10, height: 100 },
  prop = new Proxy({ width: 10, height: 10 }, new Handler(this));
  old = {};

  constructor(element) {
    this.target = element;
  }

  render() {
    console.log("render", this.old, this.prop);
    //이전에 존재했다가 사라지는 키를 찾기 위해 준비
    const oldKeys = Object.keys(this.old);

    //현재 prop을 복사하기 위한 객체
    const cloneProp = {};

    //현재 prop의 상태를 old와 비교
    const diff = Object.entries(this.prop).reduce((value, [k, v]) => {
      cloneProp[k] = v;

      //old에 없거나 값이 다르면 diff에 포함
      if (!this.old[k] || this.old[k] !== v) value[k] = v;

      //oldKey에서 지금 키를 제거하고 남은 old에만 있는 키
      const i = oldKeys.indexOf(k);
      if (i !== -1) oldKeys.splice(i, 1);

      return value;
    }, {});

    //old를 다 썼으므로 갱신함.
    this.old = cloneProp;

    //old에만 있는 키에 대해 제거 작업을 진행
    oldKeys.forEach((k) => delete this.target[k]);

    //변화가 있는 diff만 적용
    if (Object.keys(diff).length)
      Object.assign(this.target.style, styleTable.converter(this.prop));
  }

  render2() {
    //old와 prop이 같은 지 비교
    console.log(this.old, this.prop);
    if (JSON.stringify(this.old) === JSON.stringify(this.prop)) {
      return;
    }

    // old에만 있는 키에 대해 제거
    const deleteItem = Object.keys(this.old).filter(
      (v) => !Object.keys(this.prop).includes(v)
    );
    deleteItem.forEach((v) => delete this.target[v]);

    // prop을 반영
    Object.assign(this.old, this.prop);
    Object.assign(this.target.style, styleTable.converter(this.prop));
  }
};

// const id = setInterval((_) => {
//   viewModel.prop.width += 10;
//   viewModel.render();
// }, 1000);

const vm = new viewModel(document.querySelector(".box"));

const id = setInterval((_) => {
  console.log("setInterval", vm.prop.width, vm.prop.height);
  vm.prop.width = vm.prop.width + 10;
  vm.prop.height = vm.prop.height + 10;
  // vm.prop.test = 10;
  console.log("renderTarget", renderTarget);
}, 1000);

img.addEventListener("click", (_) => clearInterval(id));
