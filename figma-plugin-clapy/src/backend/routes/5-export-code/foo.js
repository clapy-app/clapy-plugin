const instance = {
  id: '2761:89832',
  children: [
    {
      id: 'I2761:89832;2761:89827',
    },
    {
      id: 'I2761:89832;2761:89829',
    },
    {
      id: 'I2761:89832;2761:89830',
    },
  ],
};
const nodeOfComp = {
  id: '2761:89831',
  children: [
    {
      id: '2761:89826',
    },
    {
      id: '2761:89827',
    },
    {
      id: '2761:89829',
    },
    {
      id: '2761:89830',
    },
  ],
};
function instanceToCompIndexRemapper(instance, nodeOfComp) {
  const mapper = {};
  for (let i = 0; i < instance.children.length; i++) {
    const child = instance.children[i];
    const childId = child.id;
    const compId = childId.substring(childId.lastIndexOf(';') + 1);
    const compIndex = nodeOfComp.children.findIndex(child => child.id === compId);
    mapper[i] = compIndex;
  }
  return mapper;
}

const instanceIndex = 0;
const instanceToCompMap = instanceToCompIndexRemapper(instance, nodeOfComp);
const compIndex = instanceToCompMap[instanceIndex];
const compChild = nodeOfComp.children[compIndex];
console.log('compChild:', compChild);
