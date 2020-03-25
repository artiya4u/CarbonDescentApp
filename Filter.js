export default class Filter {
  AVERAGE_BUFFER = 2;
  filter = new Array(this.AVERAGE_BUFFER);
  m_idx = 0;

  append(val) {
    this.filter[this.m_idx] = val;
    this.m_idx++;
    if (this.m_idx === this.AVERAGE_BUFFER) {
      this.m_idx = 0;
    }

    return this.average();
  }

  average() {
    let sum = 0;
    for (let x of this.filter) {
      sum += x;
      return sum / this.AVERAGE_BUFFER;
    }
  }
}
