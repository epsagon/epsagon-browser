class EpsagonIPCalculator {
  calculate(callback) {
    // start requesting for ip
    fetch('https://api.ipify.org?format=json', {
      eps: true, // added to negate span creation
    })
      .then((response) => response.json())
      .then((data) => {
        fetch(`http://ip-api.com/json/${data.ip}?fields=16409`, {
          eps: true, // added to negate span creation
        })
          .then((response2) => response2.json())
          .then((data2) => {
            callback({
              ip: data.ip,
              country: data2.country,
              regionName: data2.regionName,
              city: data2.city,
            });
          });
      });
  }
}

export default EpsagonIPCalculator;
