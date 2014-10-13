var map;

// 地図表示時の中心座標
var init_center_coords = [141.347899, 43.063968];

// 中心座標変更セレクトボックス用データ
var moveToList = [];

// マップサーバ一覧
var mapServerList = {
	"cyberjapn-std": {
		label: "地理院地図 標準地図",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	"cyberjapn-pale": {
		label: "地理院地図 淡色地図",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	'osm': {
		label: "OpenStreetMap",
		source_type: "osm",
		source: new ol.source.OSM({
		})
	},
	'osm-wms': {
		label: "OSM wms",
		source_type: "image",
		source: new ol.source.ImageWMS({
				url: 'http://ows.terrestris.de/osm/service?',
				params: {'LAYERS': 'OSM-WMS'},
			})
	},
	'stamen_toner': {
		label: "Stamen toner",
		source_type: "stamen",
		source: new ol.source.Stamen({
			layer: 'toner',
		})
	},
	'stamen_wc': {
		label: "Stamen watercolor",
		source_type: "stamen",
		source: new ol.source.Stamen({
			layer: 'watercolor',
		})
	},
};

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
	var screenHeight = $.mobile.getScreenHeight();
	var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
	var contentHeight = screenHeight - contentCurrentHeight;
	var navHeight = $("#nav1").outerHeight();
	$(".ui-content").height(contentHeight);
	$("#map").height(contentHeight - navHeight - 12);
}

/**
 * 画面の中心に同心円を描く
 * @param  {[type]} radius [description]
 * @return {[type]}        [description]
 */
function drawCenterCircle(radius)
{
	layer = getLayer(getLayerName("Circle"));
	source = layer.getSource();
	source.clear();
	if($('#cbDisplayCircle').prop('checked')) {
		view           = map.getView();
		coord          = view.getCenter();
		circleFeatures = drawConcentricCircle(coord, radius);
		source.addFeatures(circleFeatures);
	}
	return;
}

/**
 * 同心円を描く
 *
 * @param  {[type]} coordinate [description]
 * @param  {[type]} maxradius     [description]
 * @return {[type]}            [description]
 */
function drawConcentricCircle(coordinate, maxradius)
{
	features = [];
	step = Math.floor(maxradius / 5);
	for(var i=0; i<=maxradius; i+=step) {
		circleFeature = new ol.Feature({
			geometry: new ol.geom.Circle(coordinate, i)
		});
		features.push(circleFeature);
	}
	return features;
}


/**
 * 指定した緯度経度座標にマーカーを設置する
 *
 */
function setMarker(lon, lat, label)
{
	// マーカーを設置
	var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
	// Vienna marker
	var marker = new ol.Overlay({
		position: pos,
		positioning: 'center-center',
		element: $('#marker'),
		stopEvent: false
	});
	map.addOverlay(marker);

	// ラベル設定
	$('#markerTitle').html(label);
	var markerTitle = new ol.Overlay({
		position: pos,
		element: $('#markerTitle')
	});
	map.addOverlay(markerTitle);
}

/**
 * 指定した座標にアニメーションしながら移動する
 * isTransform:
 * 座標参照系が変換済みの値を使うには false,
 * 変換前の値を使うには true を指定
 */
function animatedMove(lon, lat, isTransform)
{
	// グローバル変数 map から view を取得する
	view = map.getView();
	var pan = ol.animation.pan({
		duration: 850,
		source: view.getCenter()
	});
	map.beforeRender(pan);
	if(isTransform) {
		// 座標参照系を変換する
		view.setCenter(
			ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857')
		);
	} else {
		// 座標系を変換しない
		view.setCenter([lon, lat]);
	}
}

/**
 * 指定した名前のレイヤー情報を取得する
 * @param  {[type]} layerName [description]
 * @return {[type]}           [description]
 */
function getLayer(layerName) {
	result = null;
	map.getLayers().forEach(function(layer) {
		if (layer.get('name') == layerName) {
			result = layer;
		}
	});
	return result;
}

/**
 * 指定した名称のレイヤーの表示・非表示を切り替える
 * @param  {[type]} layerName [description]
 * @param  {[type]} visible   [description]
 * @return {[type]}           [description]
 */
function switchLayer(layerName, visible) {
	map.getLayers().forEach(function(layer) {
		if (layer.get('name') == layerName) {
			layer.setVisible(visible);
		}
	});
}

/**
 * レイヤー名を取得する
 * @param  {[type]} cbName [description]
 * @return {[type]}        [description]
 */
function getLayerName(cbName)
{
	return 'layer' + cbName;
}

/**
 * countで指定した文字でsubstrした文字列で getLayerName を呼び出す
 *
 * @param  {[type]} cbName [description]
 * @param  {[type]} count  [description]
 * @return {[type]}        [description]
 */
function getLayerNameBySubStred(cbName, count)
{
	return getLayerName(cbName.substr(count));
}

/**
 * 移動先セレクトボックスに要素を追加する
 * @param  array moveToList [description]
 * @return {[type]}            [description]
 */
function appendToMoveToListBox(moveToList)
{
	nesting = "";
	for(i=0; i<moveToList.length; i++) {
		if(moveToList[i].header) {
			if(nesting !== "") {
				$('#moveTo').append(nesting);
			}
			nesting = $('<optgroup>').attr('label', moveToList[i].name);
		} else {
			nesting.append($('<option>').html(moveToList[i].name).val(i));
		}
	}
}

$(window).on("orientationchange", function() {
	resizeMapDiv();
	map.setTarget('null');
	map.setTarget('map');
});

$('#mainPage').on('pageshow', function() {
	resizeMapDiv();

	// 地図レイヤー定義
	map = new ol.Map({
		layers: [
			new ol.layer.Tile({
				opacity: 1.0,
				name: 'layerTile',
				source: mapServerList['cyberjapn-std'].source
			}),
			// 中学校区
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/MiddleSchool.geojson'
				}),
				name: 'layerMiddleSchool',
				style: middleSchoolStyleFunction,
				visible: false
			}),
			// 小学校区
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Elementary.geojson'
				}),
				name: 'layerElementarySchool',
				style: elementaryStyleFunction,
				visible: false
			}),
			// 距離同心円描画用レイヤー
			new ol.layer.Vector({
				source: new ol.source.Vector(),
				name: 'layerCircle',
				style: circleStyleFunction,
				visible: true
			}),
			// 認可外
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Ninkagai.geojson'
				}),
				name: 'layerNinkagai',
				style: nurseryStyleFunction
			}),
			// 認可
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Ninka.geojson'
				}),
				name: 'layerNinka',
				style: nurseryStyleFunction
			}),
			// 幼稚園
			new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					projection: 'EPSG:3857',
					url: 'data/Kindergarten.geojson'
				}),
				name: 'layerKindergarten',
				style: nurseryStyleFunction
			})
		],
		target: 'map',
		view: new ol.View({
			center: ol.proj.transform(init_center_coords, 'EPSG:4326', 'EPSG:3857'),
			zoom: 14,
			maxZoom: 18,
			minZoom: 10
		}),
		controls: [
			new ol.control.Attribution({collapsible: true}),
			new ol.control.ScaleLine({}), // 距離ライン定義
			new ol.control.Zoom({}),
			new ol.control.ZoomSlider({
			}),
		]
	});

	// ポップアップ定義
	var popup = new ol.Overlay({
		element: $('#popup')
	});
	map.addOverlay(popup);

	for(var item in mapServerList) {
		option = $('<option>').html(mapServerList[item].label).val(item);
		$('#changeBaseMap').append(option);
	}

	// 区一覧と区の境界データ、その他公共施設データ読み込み
	$.getJSON(
		"data/wards.geojson",
		function(data){
			moveToList.push( {name: "区", header:true} );
			var lineName = "";
			for(var i=0; i<data.features.length; i++) {
				switch(data.features[i].geometry.type) {
					case "Point":
						_name = data.features[i].properties.name;
						_lat  = data.features[i].geometry.coordinates[1];
						_lon  = data.features[i].geometry.coordinates[0];
						moveToList.push(
							{name: _name, lat: _lat, lon: _lon, header:false}
							);
						break;
					case "LineString":
						_name        = data.features[i].properties.CITY1 + data.features[i].properties.name;
						_coordinates = data.features[i].geometry.coordinates;
						moveToList.push(
							{name: _name, coordinates: _coordinates, header:false}
							);
				}
			}
			appendToMoveToListBox(moveToList);
		});

	// 駅位置JSONデータ読み込み〜セレクトボックス追加
	$.getJSON(
		"data/station.geojson",
		function(data){
			moveToList.push( {name: "公共交通機関施設", header:true} );
			var lineName = "";
			for(var i=0; i<data.features.length; i++) {
				_s = data.features[i].properties["shubetsu"] + " (" + data.features[i].properties["line"] + ")";
				if(lineName !== _s) {
					moveToList.push({name: _s, header: true});
					lineName = _s;
				}
				_name = data.features[i].properties.station_name;
				_lat  = data.features[i].properties.lat;
				_lon  = data.features[i].properties.lon;
				moveToList.push(
					{name: _name, lat: _lat, lon: _lon, header:false}
					);
			}
			appendToMoveToListBox(moveToList);
		});

	// 中心座標変更セレクトボックス操作イベント定義
	$('#moveTo').change(function(){
		if(moveToList[$(this).val()].coordinates !== undefined) {
			// 区の境界線に合わせて画面表示
			components = [];
			for(var i=0; i<moveToList[$(this).val()].coordinates.length; i++) {
				coord = moveToList[$(this).val()].coordinates[i];
				pt2coo = ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
				components.push(pt2coo);
			}
			components = [components];

			view = map.getView();
			polygon = new ol.geom.Polygon(components);
			size =  map.getSize();
			var pan = ol.animation.pan({
				duration: 850,
				source: view.getCenter()
			});
			map.beforeRender(pan);

			feature = new ol.Feature({
				geometry: polygon
			});
			layer = getLayer(getLayerName("Circle"));
			source = layer.getSource();
			source.clear();
			source.addFeature(feature);

			view.fitGeometry(
				polygon,
				size,
				{
					constrainResolution: false
				}
			);
		} else {
			// 選択座標に移動
			lon = moveToList[$(this).val()].lon;
			lat = moveToList[$(this).val()].lat;
			if(lon !== undefined && lat !== undefined) {
				animatedMove(lon, lat, true);
			}
			// マーカーを設置
			setMarker(lon, lat, moveToList[$(this).val()].name);
		}
	});

	// 保育施設クリック時の挙動を定義
	map.on('click', function(evt) {
		var feature = map.forEachFeatureAtPixel(evt.pixel,
			function(feature, layer) {
				return feature;
			}
		);
		// ポップアップを消す
		$('#popup').hide();

		// クリックした場所に要素がなんにもない場合
		if (feature === undefined) {
			coord = map.getCoordinateFromPixel(evt.pixel);
			view = map.getView();
			animatedMove(coord[0], coord[1], false);
			view.setCenter(coord);

			if($('#cbDisplayCircle').prop('checked')) {
				radius = $('#changeCircleRadius').val();
				if(radius !== "") {
					drawCenterCircle(radius);
				}
			}

		}
		// クリックした場所に既に描いた同心円がある場合
		if (feature && feature.getGeometry().getType() === "Circle") {
			$('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
			layer = getLayer(getLayerName("Circle"));
			source = layer.getSource();
			source.clear();
		}

		// クリックした場所に保育施設がある場合
		if (feature && "Point" == feature.getGeometry().getType()) {
			var geometry = feature.getGeometry();
			var coord = geometry.getCoordinates();
			popup.setPosition(coord);

			// タイトル部
			var title = '';
			title  = '[' + feature.get('種別') + '] ';
			if(feature.get('設置') !== null) {
				title += ' [' +feature.get('設置')+']';
			}
			title += feature.get('名称');

			// 内容部
			var content = '';
			content += title;
			if (feature.get('開園時間') !== null && feature.get('終園時間') !== null) {
				content += '<div>' + feature.get('開園時間') + '〜' + feature.get('終園時間');
				if( feature.get('延長') === 1) {
					content += ' [' + feature.get('備考') + ']';
				}
				content += '</div>';
			}
			if (feature.get('開始年齢') !== null && feature.get('終了年齢') !== null) {
				content += '<div>' + feature.get('開始年齢') + '〜' + feature.get('終了年齢') + '</div>';
			}
			content += '<div>';
			if (feature.get('一時') !== null) {
				content += '一時保育 ';
			}
			if (feature.get('休日') !== null) {
				content += '休日保育 ';
			}
			if (feature.get('夜間') !== null) {
				content += '夜間保育 ';
			}
			content += '</div>';
			if (feature.get('定員') !== null) {
				content += '<div>定員 '+feature.get('定員')+'人</div>';
			}
			if (feature.get('住所１') !== undefined && feature.get('住所２') !== undefined) {
				content += '<div>住所 '+feature.get('住所１')+feature.get('住所２')+'</div>';
			}
			if (feature.get('TEL') !== null) {
				content += '<div>TEL '+feature.get('TEL')+'</div>';
			}
			if (feature.get('設置者') !== null) {
				content += '<div>設置者 '+feature.get('設置者')+'</div>';
			}
			animatedMove(coord[0], coord[1], false);
			$("#popup-content").html(content);
			$('#popup').show();
		}
	});


	$('#cbKindergarten').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbNinka').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbKodomoen').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbNinkagai').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbMiddleSchool').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});
	$('#cbElementarySchool').click(function() {
		switchLayer(getLayerNameBySubStred(this.id, 2), $(this).prop('checked'));
	});

	// 地図の透明度を変更するセレクトボックス
	$('#changeOpacity').change(function(){
		opacity = 1.0;
		if($(this).val() !== "" && $(this).val() > 0) {
			opacity = $(this).val();
		}
		var tileLayer = map.getLayers().item(0);
		tileLayer.setOpacity(opacity);
	});

	$('#changeCircleRadius').change(function(evt){
		radius = $(this).val();
		if(radius === "") {
			radius = 500;
		}
		drawCenterCircle(radius);
	});

	$('#cbDisplayCircle').click(function(evt) {
		radius = $('#changeCircleRadius').val();
		if(radius === "") {
			radius = 500;
		}
		drawCenterCircle(radius);
	});

	// 地図変更選択ボックス操作時のイベント
	$('#changeBaseMap').change(function(evt) {
		map.removeLayer(map.getLayers().item(0));

		source_type = mapServerList[$(this).val()].source_type;
		var layer = null;
		switch(source_type) {
			case 'image':
				layer = new ol.layer.Image({
					opacity: $('#changeOpacity option:selected').val(),
					source: mapServerList[$(this).val()].source
				});
				break;
			default:
				layer = new ol.layer.Tile({
					opacity: $('#changeOpacity option:selected').val(),
					source: mapServerList[$(this).val()].source
				});
				break;
		}

		map.getLayers().insertAt(0, layer);
	});

	$('#popup-closer').click(function(evt){
		$('#popup').hide();
		return;
	});
});
