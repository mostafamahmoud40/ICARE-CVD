import streamlit as st
import numpy as np
import utils.interface as interface
import tempfile
import os
import nibabel as nib
import torch
import base64
import joblib
from utils.visualizations import (
    build_seg_gif,
    display_3d_rendering,
    display_mpr,
    display_overview,
    display_seg_grid,
    display_video,
    interactive_seg_viewer,
    plot_intensity_histogram,
    plot_mean_signal_per_slice,
    plot_thickening_map,
    plot_wall_motion,
)


def resources_available(paths, label):
    missing = [p for p in paths if not os.path.exists(p)]
    if missing:
        st.warning(f"Missing {label}: {', '.join(missing)}")
        return False
    return True


def get_device_type():
    return "cuda" if torch.cuda.is_available() else "cpu"


@st.cache_resource
def load_fct_model(device_type: str):
    device = torch.device(device_type)
    model = torch.load('models/fct.model', map_location=device, weights_only=False)
    model = model.to(device)
    model.eval()
    return model


@st.cache_resource
def load_unet_model(device_type: str):
    from utils.unet import UNet
    device = torch.device(device_type)
    unet = UNet()
    state = torch.load("models/UNet.pt", map_location=device, weights_only=False)
    unet.load_state_dict(state)
    unet = unet.to(device)
    unet.eval()
    return unet


@st.cache_resource
def load_scaler():
    return joblib.load("transformers/robustscaler.joblib")


@st.cache_resource
def load_classifier():
    return joblib.load('models/classifier.pkl')


@st.cache_resource
def load_vae_model(device_type: str):
    device = torch.device(device_type)
    vae = torch.load("models/vautoencoder.model", map_location=device, weights_only=False)
    vae = vae.to(device)
    vae.eval()
    return vae


def save_model(model, file_name, directory="models"):
    """Save model as pickle"""
    model = model.cpu()
    if not os.path.exists(directory):
        os.makedirs(directory)
    model_path = os.path.join(directory, file_name)
    torch.save(model, model_path)
    return model_path

def main():
    
    st.sidebar.title("Settings")
    # st.sidebar.subheader("Parameters")
    st.markdown(
    """
        <style>
        [data-testid="stSidebar"][aria-expanded="true"] > div:first-child{
            width:300px;
        }
        [data-testid="stSidebar"][aria-expanded="false"] > div:first-child{
            width:300px;
            margin-left:-300px;
        }
        </style>
    """,
    unsafe_allow_html=True,
    )
    
    # Classification view (only mode)
    html_temp = """ 
    <div style="background-color:orange ;padding:7px;margin-bottom:20px">
    <h2 style="color:black;text-align:center;"><b>Diagnose Cardiac Abnormality<b></h2>
    </div>
    """ 
    st.markdown(html_temp,unsafe_allow_html=True)

    device_type = get_device_type()
    model_classification = load_classifier()
    scaler    = load_scaler()
    seg_model = load_fct_model(device_type)
    seg_model.eval()
    seg_model.to(torch.device(device_type))
    vae = load_vae_model(device_type)
    
    # File inputs
    st.sidebar.title("Upload Files")
    ED = st.sidebar.file_uploader("Upload File ED (NIfTI)", type=["nii.gz"], key=3)
    ES = st.sidebar.file_uploader("Upload File ES (NIfTI)", type=["nii.gz"], key=4)

    if st.sidebar.button("Classify"):
        if ED is not None and ES is not None:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tmp1:
                tmp1.write(ED.read())
                tmp_path1 = tmp1.name
            with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tmp2:
                tmp2.write(ES.read())
                tmp_path2 = tmp2.name

            img1 = nib.load(tmp_path1, mmap=False)
            img2 = nib.load(tmp_path2, mmap=False)
            data1 = img1.get_fdata()
            data2 = img2.get_fdata()
            file_name     = ED.name
            hdr_ed_patient = img1.header
            hdr_es_patient = img2.header
            affine_ed      = img1.affine
            affine_es      = img2.affine

            with st.spinner("Model is predicting the input files, Please wait.."):
                classification, patient, batch_seg, img_ed_f, img_es_f = interface.classify(
                    data1, data2, seg_model, vae, model_classification, scaler,
                    hdr_ed_patient, hdr_es_patient, affine_ed, affine_es,
                )

            ed_masks = batch_seg[:, 0, :, :].astype(int)
            es_masks = batch_seg[:, 1, :, :].astype(int)

            st.session_state['has_results'] = True
            st.session_state['ed_data']   = data1
            st.session_state['es_data']   = data2
            st.session_state['file_name'] = file_name
            st.session_state['ed_frames'] = img_ed_f
            st.session_state['es_frames'] = img_es_f
            st.session_state['ed_masks']  = ed_masks
            st.session_state['es_masks']  = es_masks

            video_array = np.concatenate([data1, data2], axis=2).transpose(2, 0, 1).astype("uint8")
            gif_base64  = base64.b64encode(display_video(video_array)).decode("utf-8")
            seg_gif_b64 = base64.b64encode(build_seg_gif(img_ed_f, img_es_f, ed_masks, es_masks)).decode('utf-8')

            st.dataframe(patient, use_container_width=True, height=100)

            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f'<img src="data:image/gif;base64,{gif_base64}" height="400" width="400" style="padding:10%" />', unsafe_allow_html=True)
            with col2:
                st.markdown(f'<p style="color:orange;font-size:28px;font-weight: bold;padding-top:50%;padding-left:10%">Predicted class: {classification}</p>', unsafe_allow_html=True)

            st.subheader("Segmentation Animation (ED ↔ ES)")
            st.markdown(
                '<div style="display:flex;align-items:center;gap:30px;">'
                f'<img src="data:image/gif;base64,{seg_gif_b64}" height="350" width="350"/>'
                '<div style="color:white;line-height:2.2;font-size:15px;">'
                '<span style="color:cyan;">&#9632;</span> LV<br>'
                '<span style="color:orange;">&#9632;</span> Myocardium<br>'
                '<span style="color:magenta;">&#9632;</span> RV</div></div>',
                unsafe_allow_html=True,
            )

            st.subheader("Segmentation Grid: ED Phase")
            st.pyplot(display_seg_grid(img_ed_f, ed_masks, title_prefix="ED"))

            st.subheader("Segmentation Grid: ES Phase")
            st.pyplot(display_seg_grid(img_es_f, es_masks, title_prefix="ES"))

            st.plotly_chart(plot_mean_signal_per_slice(data1, data2), use_container_width=True)

            st.subheader("Overview: ED vs ES")
            st.pyplot(display_overview(data1, data2, file_name))

            st.subheader("Intensity Histogram: ED vs ES")
            st.pyplot(plot_intensity_histogram(data1, data2))

            st.subheader("Thickening Map: Myocardial Area per Slice")
            st.plotly_chart(plot_thickening_map(ed_masks, es_masks), use_container_width=True)

            st.subheader("Wall Motion Analysis: LV Centroid Displacement")
            st.plotly_chart(plot_wall_motion(ed_masks, es_masks), use_container_width=True)

            st.subheader("3D Cardiac Structure Rendering (ED Phase)")
            st.plotly_chart(display_3d_rendering(ed_masks), use_container_width=True)
        else:
            st.warning("Please upload both files.")

    if st.session_state.get('has_results'):
        st.markdown("---")
        st.subheader("Multi-Planar Reformatting (MPR) — Interactive")
        ed_vol = st.session_state['ed_data']
        es_vol = st.session_state['es_data']
        ax_i  = st.slider("Axial Slice",    0, ed_vol.shape[2] - 1, ed_vol.shape[2] // 2, key='mpr_ax')
        sag_i = st.slider("Sagittal Slice", 0, ed_vol.shape[0] - 1, ed_vol.shape[0] // 2, key='mpr_sag')
        cor_i = st.slider("Coronal Slice",  0, ed_vol.shape[1] - 1, ed_vol.shape[1] // 2, key='mpr_cor')
        st.pyplot(display_mpr(ed_vol, es_vol, ax_i, sag_i, cor_i))

        st.markdown("---")
        st.subheader("Interactive Segmentation Viewer")
        st.caption("Hover over any region to see its name — Yellow: LV | Green: Myocardium | Blue: RV")
        _ed_f = st.session_state.get('ed_frames')
        _es_f = st.session_state.get('es_frames')
        _ed_m = st.session_state.get('ed_masks')
        _es_m = st.session_state.get('es_masks')
        if _ed_f is not None:
            _phase = st.radio("Phase", ["ED", "ES"], horizontal=True, key='isv_phase')
            _frames = _ed_f if _phase == "ED" else _es_f
            _masks  = _ed_m if _phase == "ED" else _es_m
            _slice  = st.slider("Slice", 0, len(_frames) - 1, 0, key='isv_slice')
            st.plotly_chart(
                interactive_seg_viewer(_frames[_slice], _masks[_slice], _slice, _phase),
                use_container_width=True,
            )



if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        pass
