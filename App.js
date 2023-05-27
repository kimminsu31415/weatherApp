import * as Location from 'expo-location';
import { StatusBar } from "expo-status-bar";
import React, {useEffect, useState} from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';



const {width:SCREEN_WIDTH} = Dimensions.get("window");
//console.log(SCREEN_WIDTH);

// api key
const serviceKey = 'DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D';
                    

// 초단기예보 : 현재 시각에서 1시간 빼줌 (예외처리 : 23시)
// 단기예보 : 어제 날짜, 23시로 지정
var modifyTime = function(hours,day,apiType) 
{
  if (hours == '00' || apiType=="vilage")
  {
    hours = '23';
    var now = new Date();
    day = now.getDate(now.setDate(now.getDate()-1)).toString().padStart(2,'0'); // 어제 날짜
  }
  else
  {
    hours = parseInt(hours)-1;
    hours=hours.toString().padStart(2,'0');
  }
  return [hours,day];
}

function modifyRegion(region){
  if (region.charAt(region.length - 1)=="시"){
    region=region.substr(0,2);
  }
  else if (region.charAt(region.length - 1)=="도"){
    console.log(region);
    switch (region){
      case "충청북도":
        region="충북";
        break;
      case "충청남도":
        region="충남";
        break;
      case "전라북도":
        region="전북";
        break;
      case "전라남도":
        region="전남";
        break;
      case "경상북도":
        region="경북";
        break;
      case "경상남도":
        region="경남";
        break;
      default:
        region=region.substr(0,2);
    }
  }
  return region;
}

// 위도, 경도 -> x,y 좌표
var RE = 6371.00877; // 지구 반경(km)
var GRID = 5.0; // 격자 간격(km)
var SLAT1 = 30.0; // 투영 위도1(degree)
var SLAT2 = 60.0; // 투영 위도2(degree)
var OLON = 126.0; // 기준점 경도(degree)
var OLAT = 38.0; // 기준점 위도(degree)
var XO = 43; // 기준점 X좌표(GRID)
var YO = 136; // 기준점 Y좌표(GRID)    

// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
function dfs_xy_conv(code, v1, v2) {
    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    var rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        var theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    else {
        rs['x'] = v1;
        rs['y'] = v2;
        var xn = v1 - XO;
        var yn = ro - v2 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) - ra;
        var alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        }
        else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) - theta;
            }
            else theta = Math.atan2(xn, yn);
        }
        var alon = theta / sn + olon;
        rs['lat'] = alat * RADDEG;
        rs['lng'] = alon * RADDEG;
    }
    return rs;
}

// 미세먼지 api : xml 파싱
function parseXml(xml) {
  var parseString=require('react-native-xml2js').parseString;
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}


// 날씨(현재 시간) 예보 코드 -> 값
// 초단기예보 api
function extractUltraSrtWeather(json){
  const items = json.response.body.items.item;
  const currentTime=items[0]["fcstTime"]; // 현재 시간(hour)
  // console.log(currentTime);
  let weatherInfo = {}; 
  items.forEach((dic)=>{
    if (dic["fcstTime"]==currentTime){
      switch(dic["category"]){
        case "T1H": // 기온
          weatherInfo.temperature = dic["fcstValue"];
          break;
        case "SKY": // 하늘 상태
          weatherInfo.sky =dic["fcstValue"];
          break;
        case "WSD": // 풍속
          weatherInfo.wind = dic["fcstValue"];
          break;
        case "PTY": // 강수형태
          weatherInfo.rainOrsnow = dic["fcstValue"];
          break;
        case "RN1" : // 강수량
          weatherInfo.rainfall = dic["fcstValue"];
          break;
        case "REH" : // 습도
          weatherInfo.humidity=dic["fcstValue"];
          break;
      }
    }
  });
  return weatherInfo;
};

// 날씨(현재 시간) 예보 코드 -> 값
// 단기예보 api
function extractVilageWeather(json){
  const items = json.response.body.items.item;
  let weatherInfo = {}; 
  items.forEach((dic)=>{
    if (dic["category"]=='TMN'){ // 최저 기온
      weatherInfo.lowerTmp=dic["fcstValue"];
    }
    if (dic["category"]=='TMX'){ //최고 기온
      weatherInfo.upperTmp=dic["fcstValue"];
    }
  });
  console.log(weatherInfo);
  return weatherInfo;
};

function extractPm(grade){
  if (grade==1){
    return "좋음";
  }
  else if (grade==2){
    return "보통";
  }
  else if (grade==3){
    return "나쁨";
  }
  else if (grade==4){
    return "매우나쁨";
  }
}

function commentWeather(weatherDict,apiType){
  let commentDict={};
  if (apiType=="ultraSrt"){
    commentDict.temperature=weatherDict.temperature+"도";
    commentDict.wind=weatherDict.wind+"m/s";
    if (weatherDict.rainfall == "강수없음"){
      commentDict.rainfall=weatherDict.rainfall;
    }
    else{
      commentDict.rainfall=weatherDict.rainfall+"mm";
    }
    
    switch(weatherDict.sky){
      case "1":
        commentDict.sky="맑음";
        break;
      case "3":
        commentDict.sky="구름많음";
        break;
      case "4":
        commentDict.sky="흐림";
        break;
    }
    switch(weatherDict.rainOrsnow){
      case "0":
        commentDict.rainOrsnow="없음";
        break;
      case "1":
        commentDict.rainOrsnow="비";
        break;
      case "2":
        commentDict.rainOrsnow="비/눈";
        break;
      case "3":
        commentDict.rainOrsnow="눈";
        break;
      case "5":
        commentDict.rainOrsnow="빗방울";
        break;
      case "6":
        commentDict.rainOrsnow="빗방울눈날림";
        break;
      case "7":
        commentDict.rainOrsnow="눈날림";
        break;
    }   
  }
  return commentDict; 
}

// 초단기예보, 단기예보 api
function getCurrnetWeatherUrl(latitude, longitude, apiType){
  // const numOfRows = 60;
  // const pageNo = 1;

  // Get the current date and time
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  var day = currentDate.getDate().toString().padStart(2, '0');
  var hours = currentDate.getHours().toString().padStart(2, '0');
  var minutes = currentDate.getMinutes().toString().padStart(2, '0');

  var modifiedTime;
  if (apiType=="vilage"){
    modifiedTime = modifyTime(hours,day,"vilage");
  }
  else if (apiType=="ultraSrt"){
    modifiedTime = modifyTime(hours,day,"ultraSrt");
  }
  
  hours=modifiedTime[0];
  day=modifiedTime[1];

  const base_date = `${year}${month}${day}`;
  const base_time = `${hours}${minutes}`;

  var rs = dfs_xy_conv("toXY",latitude.toString(),longitude.toString());
  // console.log(rs.x, rs.y);
  const nx = rs.x;
  const ny = rs.y;
  
  return [`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${serviceKey}&numOfRows=60&pageNo=1&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}&dataType=json`,
          `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&numOfRows=290&pageNo=1&base_date=${base_date}&base_time=2300&nx=${nx}&ny=${ny}&dataType=json`];
}

function getCurrnetPmUrl(region){
  region=modifyRegion(region);
  return `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${serviceKey}&numOfRows=125&pageNo=1&sidoName=${region}&ver=1.0`;
}

function sensoryTemp(temp,humidity){
  console.log("기온,습도",temp,humidity);
  let Tw=temp*Math.atan(0.151977*Math.sqrt(humidity+8.313659)); //Tw(습구온도)
  Tw += Math.atan(temp+humidity);
  Tw -= Math.atan(humidity-1.67633);
  Tw += (0.00391838*Math.pow(humidity,1.5) * Math.atan(0.023101*humidity));
  Tw -= 4.686035;
  // Math.round(Number * 10^n) / 10^n
  let result=Math.round((-0.2442 + (0.55399*Tw) + (0.45535*temp) - (0.0022*Math.pow(Tw,2)) + (0.00278*Tw*temp) + 3.0) * 10 ) / 10; // 체감온도
  return result;
}

export default function App() {
  const [city, setCity]=useState("Loading...");
  const [subregion, setSubregion]=useState("Loading...");
  const [district, setDistrict]=useState();
  const [TEMP, setTemp]=useState();
  const [SKY, setSky]=useState();
  const [wind, setWind]=useState();
  const [rainfall, setRainfall]=useState();
  // const [humidity, setHumidity]=useState();
  const [sensoryTEMP, setSensoryTemp]=useState();
  const [lowerTEMP, setLowerTemp]=useState();
  const [upperTEMP, setUpperTemp]=useState();
  const [pm10, setPm10]=useState();
  const [pm25, setPm25]=useState();
  
  // const [location, setLocation] = useState();
  // const [days, setDays]=useState([]);
  const [ok, setOk] = useState(true);

  // 현재(위치, 시간) 날씨
  const getWeather = async () => {
    const {granted} = await Location.requestForegroundPermissionsAsync();
    if(!granted){
      setOk(false);
    }
    const {coords:{latitude, longitude}} = await Location.getCurrentPositionAsync({accuracy:5});
    

    const location = await Location.reverseGeocodeAsync(
      {latitude,longitude}, 
      {useGoogleMaps:false}
    );
    // console.log(location);
    var region=location[0].region; // 미세먼지 api 요청을 위한 변수. ex) 제주특별자치도, 경기도 ... 
    setCity(location[0].city); // ex) 제주시
    setDistrict(location[0].district); // ex) 일도이동
    setSubregion(location[0].subregion); // ex) 봉화군

    // 초단기 예보 api url
    const ultraSrtUrl = await getCurrnetWeatherUrl(latitude, longitude,"ultraSrt")[0];
    console.log(ultraSrtUrl);
    
    const ultraSrtResponse = await fetch(ultraSrtUrl);
    const ultraSrtjson = await ultraSrtResponse.json(); // 응답을 JSON 형태로 파싱
    console.log("check :", ultraSrtjson);
    ultraSrtWeatherInfo= extractUltraSrtWeather(ultraSrtjson);
    // setHumidity(ultraSrtWeatherInfo.humidity);
    setSensoryTemp(sensoryTemp(parseFloat(ultraSrtWeatherInfo.temperature),parseFloat(ultraSrtWeatherInfo.humidity)));
    setRainfall(ultraSrtWeatherInfo.rainfall);
    console.log("초단기 예보 : ",commentWeather(ultraSrtWeatherInfo,"ultraSrt"));
    // JSON.stringify() : 객체를 직접적으로 React 자식 요소로 사용할 수 없기 때문에 객체를 문자열로 변환
    // .replace(/\"/gi, "") : 따옴표 제거
    setTemp(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").temperature).replace(/\"/gi, ""));
    setSky(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").sky).replace(/\"/gi, ""));
    setWind(JSON.stringify(commentWeather(ultraSrtWeatherInfo,"ultraSrt").wind).replace(/\"/gi, ""));
    
    
    
    

    // 단기 예보 api url
    const vilageUrl = getCurrnetWeatherUrl(latitude, longitude,"vilage")[1];
    console.log(vilageUrl);
    const vilageResponse = await fetch(vilageUrl);
    const vilageJson = await vilageResponse.json(); // 응답을 JSON 형태로 파싱
    // console.log("json1:",vilageJson);
    vilageWeatherInfo=extractVilageWeather(vilageJson);
    console.log("단기 예보 : ",(vilageWeatherInfo));

    setLowerTemp(JSON.stringify(vilageWeatherInfo.lowerTmp).replace(/\"/gi, ""));
    setUpperTemp(JSON.stringify(vilageWeatherInfo.upperTmp).replace(/\"/gi, ""));
    
    
    // const pmJson = await pmResponse.json(); // 응답을 JSON 형태로 파싱
    // pmInfo=extractPm(pmJson);
    // console.log("미세먼지 : ",(pmInfo));
    // url = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';
    // const pmResponse = await fetch(url, {
    //   method : "GET",
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     serviceKey : serviceKey,
    //     returnType : 'json',
    //     numOfRows : 125,
    //     pageNo: 1,
    //     sidoName : modifyRegion(region),
    //     ver: 1.0
    //   }),
    // })
    
    // 미세먼지 api url
    const pmUrl = getCurrnetPmUrl(region);
    console.log("pmurl",pmUrl);
    var pmResponse = await fetch(pmUrl);
    pmResponse=await pmResponse.text();

    try {
      var parseResult = await parseXml(pmResponse);
      var pmSum10=0;
      var pmSum25 = 0;
      var count10=0;
      var count25 = 0;
      const items = parseResult.response.body[0].items[0].item;
      for (const item of items) {
        const pm10Grade = parseInt(item.pm10Grade[0]);
        const pm25Grade = parseInt(item.pm25Grade[0]);
        if (!isNaN(pm10Grade)) {
          pmSum10 += pm10Grade;
          count10 += 1;
        }
        if (!isNaN(pm25Grade)) {
          pmSum25 += pm25Grade;
          count25 += 1;
        }
        // console.log("pm10Grade:", pm10Grade);
      }
      setPm10(extractPm(Math.round(pmSum10 / count10)));
      setPm25(extractPm(Math.round(pmSum25 / count25)));
      console.log("미세먼지 등급: ",pm10);
    } catch (err) {
      console.log("Error:", err); // console에 'Error: [TypeError: Cannot read property 'body' of undefined]' 이렇게 떠도 앱에는 잘 출력됨(왜..?)
    }
    
    

//     const pmUrl = getCurrnetPmUrl(region);
//     fetch(pmUrl)
//     .then(function(response) {
//         return response.json();
//     })
//     .then(function(json) {
//         console.log(json);
//         return json
//     })
// console.log(1);
// console.log(2);

  };

  // 날씨 비교 분석
  const compareWeather = async () => {
    const testUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D&numOfRows=60&pageNo=1&base_date=20230527&base_time=1400&nx=60&ny=127&dataType=json`;
    const compareResponse = await fetch(testUrl);
    const compareJson = await compareResponse.json();
    compareInfo=extractUltraSrtWeather(compareJson);
    console.log("검색 지역 : ", commentWeather(compareInfo,"ultraSrt"));

    

    

  };

  useEffect(() => {
    getWeather();
    compareWeather();
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar style="light"></StatusBar>
      <View style={styles.city}>
        <Text style={styles.cityName}>{city} {subregion} {district}</Text>
      </View>
      <ScrollView
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        horizontal 
        contentContainerStyle={styles.weather}
      >
        <View style={styles.day}>
          <Text style={styles.temp}>{TEMP}</Text>
          <Text style={styles.description}>{SKY}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>{lowerTEMP}</Text>
          <Text style={styles.description}>{upperTEMP}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>미세먼지 </Text>
          <Text style={styles.description}>{pm10}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>초미세먼지</Text>
          <Text style={styles.description}>{pm25}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>체감온도</Text>
          <Text style={styles.description}>{sensoryTEMP}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>풍속</Text>
          <Text style={styles.description}>{wind}</Text>
        </View>
        <View style={styles.day}>
          <Text style={styles.temp}>강수량</Text>
          <Text style={styles.description}>{rainfall}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1, 
    backgroundColor:"green"
  },
  city:{
    flex:1,
    //backgroundColor:"blue",
    justifyContent:"center",
    alignItems:"center"
  },
  cityName:{
    fontSize:60,
    fontWeight:"500"
  },
  weather:{
    //flex:3,
    //backgroundColor:"blue"
  },
  day:{
    width:SCREEN_WIDTH,
    //flex:1,
    //backgroundColor:"teal",
    alignItems:"center"
  },
  temp:{
    marginTop:30,
    fontSize:100,
  },
  description:{
    fontSize:70,
  }
})
