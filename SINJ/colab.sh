# conda environment setup
cd /content/SINJ
conda env create -n SINJ python=3.7
conda init bash
source ~/.bashrc
source activate SINJ
conda install pytorch==1.6.0 torchvision==0.7.0 -c pytorch
# conda install pytorch==1.6.0 torchvision==0.7.0 cudatoolkit=10.1 -c pytorch
pip install opendr
python setup.py develop
